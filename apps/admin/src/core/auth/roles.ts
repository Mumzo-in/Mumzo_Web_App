/**
 * Role helpers for the session.
 *
 * There is deliberately **no hardcoded role list here any more** — roles live
 * in `staff_role` and are created from the panel, so a fixed union would go
 * stale the moment an operator adds one. Components that need the list fetch
 * it via `rolesQueryOptions` in `@/modules/roles`.
 *
 * What remains is only what reads a role off a session.
 */

/** A session user, as far as the role gate cares. */
type SessionUser = Record<string, unknown>;

/**
 * Reads the role string off a session user.
 *
 * Returns `null` when absent — callers must treat that as deny. Fails closed:
 * a missing or malformed role denies rather than falling back to any baseline
 * access.
 *
 * The value may be comma-separated when a user holds several roles, matching
 * how Better Auth stores it.
 */
export function resolveRole(
  user: SessionUser | null | undefined,
): string | null {
  if (user && typeof user.role === "string" && user.role.trim()) {
    return user.role;
  }

  return null;
}

/** Splits a stored role string into individual keys. */
export function roleKeys(role: string | null | undefined): string[] {
  if (!role) {
    return [];
  }

  return role
    .split(",")
    .map((key) => key.trim())
    .filter(Boolean);
}

/**
 * Best-effort display name for a role key, for when the roles list is not
 * loaded. Prefer the `label` from `rolesQueryOptions` where it is available.
 */
export function humanizeRoleKey(key: string): string {
  return key
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
