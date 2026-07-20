/**
 * User roles.
 *
 * Six staff roles, matching `docs/superadmin/features.md` §1 — including
 * `ops`, which the API plan's §15k omits. The docs conflict; features.md is
 * the one the dark-store fleet model needs.
 *
 * Not enforced yet: Better Auth runs with `plugins: []` and the `user` table
 * has no `role` column. These exist so the values are declared in one place
 * when the admin plugin lands.
 */

export const CUSTOMER_ROLE = "customer" as const;

export const STAFF_ROLES = [
  "superadmin",
  "admin",
  "catalog_manager",
  "support",
  "finance",
  "ops",
] as const;

export type StaffRole = (typeof STAFF_ROLES)[number];

export const ROLES = [CUSTOMER_ROLE, ...STAFF_ROLES] as const;

export type Role = (typeof ROLES)[number];

export const isStaffRole = (role: string): role is StaffRole =>
  STAFF_ROLES.includes(role as StaffRole);
