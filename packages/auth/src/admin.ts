import { createDb } from "@mumzo/db";
import {
  staffAccount,
  staffSession,
  staffUser,
  staffVerification,
} from "@mumzo/db/schema/staff";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { openAPI } from "better-auth/plugins";
import { admin as adminPlugin } from "better-auth/plugins/admin";

import { ac, roles } from "./permissions";
import { sharedAuthConfig } from "./shared";

/**
 * Six staff roles, matching `docs/superadmin/features.md` §1 — including
 * `ops`, which the API plan's §15k omits. The docs conflict; features.md is
 * the one the dark-store fleet model needs.
 *
 * Mirrored in `apps/server/src/core/constants/roles.ts` for route guards.
 */
export const STAFF_ROLES = [
  "superadmin",
  "admin",
  "catalog_manager",
  "support",
  "finance",
  "ops",
] as const;

export type StaffRole = (typeof STAFF_ROLES)[number];

/**
 * Staff auth — the admin panel.
 *
 * Email + password. Separate tables from the customer instance (see
 * `packages/db/src/schema/staff.ts`), so a customer session cannot reach an
 * admin route even if a guard is missed.
 *
 * Mounted at `/api/v1/admin/auth/*`.
 */
export function createAdminAuth() {
  const db = createDb();

  return betterAuth({
    ...sharedAuthConfig,
    appName: "Mumzo Admin",
    basePath: "/api/v1/admin/auth",
    database: drizzleAdapter(db, {
      provider: "pg",
      schema: {
        user: staffUser,
        session: staffSession,
        account: staffAccount,
        verification: staffVerification,
      },
    }),
    emailAndPassword: {
      enabled: true,
      // Staff accounts are created by a superadmin, never self-served.
      disableSignUp: true,
      minPasswordLength: 12,
    },
    session: {
      // Short, unlike the customer's 30 days. An admin session is a far more
      // valuable thing to steal.
      expiresIn: 60 * 60 * 8,
      updateAge: 60 * 60,
    },
    advanced: {
      ...sharedAuthConfig.advanced,
      // Distinct cookie name — this is what stops the two sessions from being
      // interchangeable in a browser that holds both.
      cookiePrefix: "mumzo-admin",
    },
    plugins: [
      adminPlugin({
        // `roles` is required for any adminRole beyond the plugin's built-in
        // "admin" — it validates adminRoles against these keys and throws at
        // startup otherwise.
        ac,
        roles,
        defaultRole: "support",
        adminRoles: ["superadmin", "admin"],
      }),
      openAPI({ disableDefaultReference: true }),
    ],
  });
}

export const adminAuth = createAdminAuth();
