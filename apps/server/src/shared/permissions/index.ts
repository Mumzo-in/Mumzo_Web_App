import { db } from "@mumzo/db";
import { staffRole, staffRolePermission } from "@mumzo/db/schema/staff";
import { eq } from "drizzle-orm";

/**
 * Role → permission resolution, backed by `staff_role_permission`.
 *
 * Better Auth's `admin` plugin cannot do this: its `hasPermission` is
 * synchronous and reads an in-memory config object, and `dynamicAccessControl`
 * exists only in the `organization` plugin. So resolution lives here.
 */

/** `"product"` → `Set{"create","read"}` */
export type PermissionSet = Map<string, Set<string>>;

/**
 * Cached because this is read on every guarded request, and an uncached join
 * per request is the wrong default. Busted explicitly on any role write —
 * see `invalidatePermissionCache`.
 *
 * Per-process: a second container has its own copy. Acceptable while a role
 * edit is rare and a stale grant expires within the TTL; revisit alongside the
 * rate limiter when Redis lands.
 */
const cache = new Map<string, { at: number; permissions: PermissionSet }>();
const TTL_MS = 60_000;

export function invalidatePermissionCache(roleKey?: string) {
  if (roleKey) {
    cache.delete(roleKey);
    return;
  }

  cache.clear();
}

async function loadRolePermissions(roleKey: string): Promise<PermissionSet> {
  const rows = await db
    .select({
      resource: staffRolePermission.resource,
      action: staffRolePermission.action,
    })
    .from(staffRolePermission)
    .innerJoin(staffRole, eq(staffRole.id, staffRolePermission.roleId))
    .where(eq(staffRole.key, roleKey));

  const permissions: PermissionSet = new Map();

  for (const { resource, action } of rows) {
    const actions = permissions.get(resource) ?? new Set<string>();
    actions.add(action);
    permissions.set(resource, actions);
  }

  return permissions;
}

async function getRolePermissions(roleKey: string): Promise<PermissionSet> {
  const hit = cache.get(roleKey);

  if (hit && Date.now() - hit.at < TTL_MS) {
    return hit.permissions;
  }

  const permissions = await loadRolePermissions(roleKey);

  cache.set(roleKey, { at: Date.now(), permissions });

  return permissions;
}

/**
 * Resolves the union of a user's grants.
 *
 * `staff_user.role` is comma-separated — Better Auth splits on commas in its
 * own `hasPermission`, so a user may hold several roles and we match that.
 */
export async function resolvePermissions(
  role: string | null | undefined,
): Promise<PermissionSet> {
  if (!role) {
    return new Map();
  }

  const keys = role
    .split(",")
    .map((key) => key.trim())
    .filter(Boolean);

  if (keys.length === 1 && keys[0]) {
    return getRolePermissions(keys[0]);
  }

  const merged: PermissionSet = new Map();

  for (const key of keys) {
    const permissions = await getRolePermissions(key);

    for (const [resource, actions] of permissions) {
      const target = merged.get(resource) ?? new Set<string>();

      for (const action of actions) {
        target.add(action);
      }

      merged.set(resource, target);
    }
  }

  return merged;
}

export async function hasPermission(
  role: string | null | undefined,
  resource: string,
  action: string,
): Promise<boolean> {
  const permissions = await resolvePermissions(role);

  return permissions.get(resource)?.has(action) ?? false;
}

/** Serializable shape for the client — `Map`/`Set` do not survive JSON. */
export function toPlainPermissions(
  permissions: PermissionSet,
): Record<string, string[]> {
  return Object.fromEntries(
    [...permissions].map(([resource, actions]) => [resource, [...actions]]),
  );
}
