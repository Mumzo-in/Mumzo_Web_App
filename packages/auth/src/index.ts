/**
 * `@mumzo/auth` — two independent Better Auth instances.
 *
 *   platformAuth  customers, phone + OTP      → /api/v1/auth/*
 *   adminAuth     staff, email + password     → /api/v1/admin/auth/*
 *
 * They do not share a user table. See `packages/db/src/schema/staff.ts` for
 * why that isolation is structural rather than a role check.
 *
 * There is deliberately no default `auth` export — importing "the" auth
 * instance is now ambiguous, and a wrong guess is a security bug. Name the
 * one you mean.
 */

export { adminAuth, createAdminAuth } from "./admin";
export {
  ACTION_LABELS,
  ac,
  RESOURCE_LABELS,
  ROLE_SEEDS,
  type RoleSeed,
  roles,
  statement,
} from "./permissions";
export { createPlatformAuth, platformAuth } from "./platform";
export { runSeed, seedAdminUser, seedRoles } from "./seed";
export { sharedAuthConfig } from "./shared";
