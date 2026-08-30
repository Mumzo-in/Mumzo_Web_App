import { createDb } from "@mumzo/db";
import { account, session, user, verification } from "@mumzo/db/schema/auth";
import { env } from "@mumzo/env/server";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { createAuthMiddleware } from "better-auth/api";
import { openAPI } from "better-auth/plugins";
import { phoneNumber } from "better-auth/plugins/phone-number";
import { desc, eq } from "drizzle-orm";

import { sendOtp, sharedAuthConfig } from "./shared";

const BYPASS_CODE = "111111";

/**
 * When `OTP_BYPASS` is on, submitting "111111" verifies successfully for any
 * phone number — the `phone-number` plugin always generates and stores a
 * real random code itself (there is no config hook to override that), so the
 * only way to accept a fixed code is to intercept the verify request before
 * it reaches the plugin's handler and swap in whatever code is actually
 * stored for that phone number. Looks up the latest `verification` row for
 * the identifier (stored as `"{code}:0"` by the plugin) and rewrites
 * `ctx.body.code` to match it, so the plugin's own lookup-and-consume logic
 * still runs unmodified. No-ops (throws through to the plugin's normal
 * "invalid/expired code" error) if no row is found.
 */
function otpBypassHook(db: ReturnType<typeof createDb>) {
  return createAuthMiddleware(async (ctx) => {
    if (
      !env.OTP_BYPASS ||
      ctx.path !== "/phone-number/verify" ||
      ctx.body?.code !== BYPASS_CODE
    ) {
      return;
    }

    const phone = ctx.body.phoneNumber as string;
    const [latest] = await db
      .select({ value: verification.value })
      .from(verification)
      .where(eq(verification.identifier, phone))
      .orderBy(desc(verification.createdAt))
      .limit(1);

    if (!latest) {
      return;
    }

    const realCode = latest.value.split(":")[0];
    if (realCode) {
      ctx.body.code = realCode;
    }
  });
}

/**
 * Customer auth — the storefront.
 *
 * Phone + OTP only. Indian quick-commerce customers do not want passwords,
 * and the built frontend (`apps/platform/src/pages/auth/`) is already
 * OTP-only. `emailAndPassword` stays disabled here; staff use it instead
 * (see `admin.ts`).
 *
 * Mounted at `/api/v1/auth/*`.
 */
export function createPlatformAuth() {
  const db = createDb();

  return betterAuth({
    ...sharedAuthConfig,
    appName: "Mumzo",
    basePath: "/api/v1/auth",
    database: drizzleAdapter(db, {
      provider: "pg",
      schema: { user, session, account, verification },
    }),
    emailAndPassword: {
      enabled: false,
    },
    session: {
      // Long-lived: a storefront customer should not be signed out between
      // grocery orders.
      expiresIn: 60 * 60 * 24 * 30,
      updateAge: 60 * 60 * 24,
    },
    user: {
      additionalFields: {
        // Set once the post-signup "complete your profile" onboarding flow
        // finishes (or its optional parts are skipped). Exposed on the
        // session/user object so the frontend can detect "needs onboarding"
        // without a dedicated read endpoint. See `packages/db/src/schema/
        // auth.ts` for why this is explicit rather than inferred from
        // `name === phoneNumber`.
        onboardedAt: {
          type: "date",
          required: false,
          input: false,
        },
      },
    },
    advanced: {
      ...sharedAuthConfig.advanced,
      // Distinct from the admin cookie so the two sessions coexist in one
      // browser and neither can be presented to the other's routes.
      cookiePrefix: "mumzo",
    },
    hooks: {
      before: otpBypassHook(db),
    },
    plugins: [
      phoneNumber({
        sendOTP: async ({ phoneNumber: to, code }, request) => {
          // Passed through for per-IP rate limiting, so one host cannot
          // cycle codes through many numbers. Same header the shared
          // config trusts for Better Auth's own limiter — see the note
          // there on why `x-forwarded-for` is safe in this topology.
          const forwarded = request?.headers?.get("x-forwarded-for");
          const ipAddress = forwarded?.split(",")[0]?.trim();

          await sendOtp(to, code, ipAddress);
        },
        otpLength: 6,
        expiresIn: 300,
        signUpOnVerification: {
          // Better Auth requires an email on the user row. Customers never
          // supply one, so derive a non-routable placeholder — the phone
          // number remains the real identifier.
          getTempEmail: (phone) => `${phone}@phone.mumzo.local`,
          getTempName: (phone) => phone,
        },
      }),
      openAPI({ disableDefaultReference: true }),
    ],
  });
}

export const platformAuth = createPlatformAuth();
