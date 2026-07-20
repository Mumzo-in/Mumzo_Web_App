import { createDb } from "@mumzo/db";
import { account, session, user, verification } from "@mumzo/db/schema/auth";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { openAPI } from "better-auth/plugins";
import { phoneNumber } from "better-auth/plugins/phone-number";

import { sendOtp, sharedAuthConfig } from "./shared";

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
    advanced: {
      ...sharedAuthConfig.advanced,
      // Distinct from the admin cookie so the two sessions coexist in one
      // browser and neither can be presented to the other's routes.
      cookiePrefix: "mumzo",
    },
    plugins: [
      phoneNumber({
        sendOTP: async ({ phoneNumber: to, code }) => {
          await sendOtp(to, code);
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
