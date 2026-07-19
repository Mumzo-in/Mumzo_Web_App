/**
 * Admin role model — the single place role is read and checked.
 *
 * NOTE: `packages/auth` has no role plugin and no roles table yet, so no
 * session actually carries a role. Until Better Auth's `admin` plugin lands,
 * `resolveRole` falls back to `DEV_FALLBACK_ROLE` in dev so the UI is
 * navigable. That fallback is the ONLY thing standing between a signed-in
 * customer and the panel, and it is compiled out of production builds.
 *
 * When the plugin lands, only `resolveRole` changes.
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

/** Dev-only stand-in until sessions carry a real role. Never used in prod. */
const DEV_FALLBACK_ROLE: AdminRole = "superadmin";

/**
 * TEMPORARY — skips the auth gate entirely so the panel can be built and
 * reviewed before there is any account to sign in with. While this is true,
 * `/login` is never reached and every admin route renders unauthenticated.
 *
 * Flip to `false` (or delete, with `bypassAuthGate`) once staff accounts and
 * the Better Auth `admin` plugin exist. It is ignored in production builds —
 * see `bypassAuthGate` — so this cannot ship as an open door.
 */
const DEV_SKIP_AUTH_GATE = true;

/**
 * Whether the auth gate should be skipped for this build.
 *
 * Two ways to skip:
 *   1. Local dev — `DEV_SKIP_AUTH_GATE && isDevBuild()`, on by default so the
 *      panel is usable before there's an account to sign in with.
 *   2. A deployed build with no backend — set `VITE_SKIP_AUTH=true`. This works
 *      in production builds (unlike (1), which vite folds to false), so a
 *      preview deploy can render on mock data without a server to authenticate
 *      against.
 *
 * ⚠️ `VITE_SKIP_AUTH=true` leaves the panel open to anyone with the URL — it's
 * for private preview deploys only. Unset it (or set `false`) the moment a real
 * backend is in place.
 */
export function bypassAuthGate(): boolean {
  if (import.meta.env?.VITE_SKIP_AUTH === "true") {
    return true;
  }
  return DEV_SKIP_AUTH_GATE && isDevBuild();
}

/**
 * Vite replaces `import.meta.env.DEV` at build time. Read defensively: outside
 * the vite pipeline (bun scripts, tests) `env` is absent, and an unguarded
 * access would throw inside the auth gate. Absent means "not dev" — the safe
 * direction, since the fallback grants access.
 */
function isDevBuild(): boolean {
  return import.meta.env?.DEV === true;
}

export function isAdminRole(value: unknown): value is AdminRole {
  return (
    typeof value === "string" &&
    (ADMIN_ROLES as readonly string[]).includes(value)
  );
}

/**
 * A session user, as far as the role gate cares.
 *
 * `role` is declared optional-unknown because Better Auth's user type does not
 * carry it yet — `packages/auth` has no `admin` plugin, so no session in this
 * codebase actually has a role. Typing it this way lets the gate be written
 * correctly today and start returning real roles the moment the plugin adds
 * the field, with no call-site changes.
 */
type SessionUser = Record<string, unknown>;

/**
 * Reads the role off a session user.
 *
 * Returns `null` when no valid admin role is present — the caller must treat
 * `null` as "deny". In production a missing role is always a denial; the dev
 * fallback exists only so the panel is usable before the auth plugin lands.
 */
export function resolveRole(
  user: SessionUser | null | undefined,
): AdminRole | null {
  if (user && isAdminRole(user.role)) {
    return user.role;
  }

  if (isDevBuild() && user) {
    return DEV_FALLBACK_ROLE;
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
