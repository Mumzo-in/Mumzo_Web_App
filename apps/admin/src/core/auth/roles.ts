/**
 * Admin role model — the single place role is read and checked.
 *
 * Sessions now carry a real `role`: the admin instance in
 * `packages/auth/src/admin.ts` runs Better Auth's `admin` plugin against the
 * `staff_user` table. There is no dev fallback and no bypass — sign in with a
 * seeded account (`bun seed:admin`).
 */

/**
 * Six roles, per docs/superadmin/features.md §1. The api-plan §15k list omits
 * `ops`; features.md's dark-store fleet model needs it. Reconcile in the API
 * before the staff endpoints are built.
 */
export const ADMIN_ROLES = [
  "superadmin",
  "admin",
  "catalog_manager",
  "support",
  "finance",
  "ops",
] as const;

export type AdminRole = (typeof ADMIN_ROLES)[number];

export function isAdminRole(value: unknown): value is AdminRole {
  return (
    typeof value === "string" &&
    (ADMIN_ROLES as readonly string[]).includes(value)
  );
}

/**
 * A session user, as far as the role gate cares. Kept structural rather than
 * importing Better Auth's user type so this file stays free of auth imports.
 */
type SessionUser = Record<string, unknown>;

/**
 * Reads the role off a session user.
 *
 * Returns `null` when no valid admin role is present, and the caller must
 * treat `null` as deny. Fails closed on purpose: an unrecognised role string
 * — a typo, a role removed from `ADMIN_ROLES`, a tampered session — denies
 * rather than defaulting to some baseline access.
 */
export function resolveRole(
  user: SessionUser | null | undefined,
): AdminRole | null {
  if (user && isAdminRole(user.role)) {
    return user.role;
  }

  return null;
}

/** Human-readable labels for the role chips / staff screens. */
export const ROLE_LABELS: Record<AdminRole, string> = {
  superadmin: "Super Admin",
  admin: "Admin",
  catalog_manager: "Catalog Manager",
  support: "Support",
  finance: "Finance",
  ops: "Ops",
};
