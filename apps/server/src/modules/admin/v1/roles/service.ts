import { ACTION_LABELS, RESOURCE_LABELS, statement } from "@mumzo/auth";
import { db } from "@mumzo/db";
import {
  staffRole,
  staffRolePermission,
  staffUser,
} from "@mumzo/db/schema/staff";
import { eq, inArray, sql } from "drizzle-orm";

import { conflict, notFound } from "@/core/errors";
import { invalidatePermissionCache } from "@/shared/permissions";

/** Superadmin's own grants are locked — editing them can lock you out. */
const PROTECTED_KEY = "superadmin";

/**
 * The resource/action vocabulary, from code.
 *
 * Deliberately not a database table: a permission is only real because a
 * route checks it, so the list of what *can* be granted has to track the
 * code, not the other way round.
 */
export function permissionCatalog() {
  return {
    resources: Object.entries(statement).map(([key, actions]) => ({
      key,
      label: RESOURCE_LABELS[key] ?? key,
      actions: (actions as readonly string[]).map((action) => ({
        key: action,
        label: ACTION_LABELS[action] ?? action,
      })),
    })),
  };
}

/** Rejects grants naming a resource or action no code implements. */
function assertKnownPermissions(permissions: Record<string, string[]>) {
  const vocabulary = statement as Record<string, readonly string[]>;

  for (const [resource, actions] of Object.entries(permissions)) {
    const known = vocabulary[resource];

    if (!known) {
      throw conflict(`Unknown resource: ${resource}`);
    }

    for (const action of actions) {
      if (!known.includes(action)) {
        throw conflict(`Unknown action for ${resource}: ${action}`);
      }
    }
  }
}

async function permissionsByRoleId(roleIds: string[]) {
  if (roleIds.length === 0) {
    return new Map<string, Record<string, string[]>>();
  }

  const rows = await db
    .select({
      roleId: staffRolePermission.roleId,
      resource: staffRolePermission.resource,
      action: staffRolePermission.action,
    })
    .from(staffRolePermission);

  const byRole = new Map<string, Record<string, string[]>>();

  for (const row of rows) {
    if (!roleIds.includes(row.roleId)) {
      continue;
    }

    const grants = byRole.get(row.roleId) ?? {};
    grants[row.resource] = [...(grants[row.resource] ?? []), row.action];
    byRole.set(row.roleId, grants);
  }

  return byRole;
}

/**
 * Counts staff per role key.
 *
 * `staff_user.role` is a comma-separated string, so this cannot be a join —
 * a user with `"support,finance"` counts toward both.
 */
async function memberCounts() {
  const rows = await db
    .select({ role: staffUser.role, count: sql<number>`count(*)::int` })
    .from(staffUser)
    .groupBy(staffUser.role);

  const counts = new Map<string, number>();

  for (const { role, count } of rows) {
    if (!role) {
      continue;
    }

    for (const key of role
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean)) {
      counts.set(key, (counts.get(key) ?? 0) + count);
    }
  }

  return counts;
}

export async function listRoles() {
  const roles = await db.select().from(staffRole).orderBy(staffRole.key);
  const [perms, counts] = await Promise.all([
    permissionsByRoleId(roles.map((r) => r.id)),
    memberCounts(),
  ]);

  return roles.map((role) => ({
    id: role.id,
    key: role.key,
    label: role.label,
    description: role.description,
    isSystem: role.isSystem,
    memberCount: counts.get(role.key) ?? 0,
    permissions: perms.get(role.id) ?? {},
  }));
}

async function requireRole(id: string) {
  const [role] = await db
    .select()
    .from(staffRole)
    .where(eq(staffRole.id, id))
    .limit(1);

  if (!role) {
    throw notFound("Role");
  }

  return role;
}

export async function createRole(input: {
  key: string;
  label: string;
  description?: string;
  permissions?: Record<string, string[]>;
}) {
  const permissions = input.permissions ?? {};

  assertKnownPermissions(permissions);

  const [existing] = await db
    .select({ id: staffRole.id })
    .from(staffRole)
    .where(eq(staffRole.key, input.key))
    .limit(1);

  if (existing) {
    throw conflict(`A role with key "${input.key}" already exists`);
  }

  const id = `role_${crypto.randomUUID()}`;

  await db.transaction(async (tx) => {
    await tx.insert(staffRole).values({
      id,
      key: input.key,
      label: input.label,
      description: input.description ?? null,
      isSystem: false,
    });

    const rows = Object.entries(permissions).flatMap(([resource, actions]) =>
      actions.map((action) => ({ roleId: id, resource, action })),
    );

    if (rows.length > 0) {
      await tx.insert(staffRolePermission).values(rows);
    }
  });

  invalidatePermissionCache(input.key);

  return id;
}

export async function updateRole(
  id: string,
  input: { label?: string; description?: string | null },
) {
  await requireRole(id);

  await db
    .update(staffRole)
    .set({
      ...(input.label !== undefined ? { label: input.label } : {}),
      ...(input.description !== undefined
        ? { description: input.description }
        : {}),
    })
    .where(eq(staffRole.id, id));
}

export async function setRolePermissions(
  id: string,
  permissions: Record<string, string[]>,
) {
  const role = await requireRole(id);

  if (role.key === PROTECTED_KEY) {
    throw conflict(
      "Superadmin permissions cannot be changed — it would be possible to lock every operator out of the panel.",
    );
  }

  assertKnownPermissions(permissions);

  // Replace wholesale rather than diffing: the matrix UI always submits the
  // complete set, and a partial update would silently keep revoked grants.
  await db.transaction(async (tx) => {
    await tx
      .delete(staffRolePermission)
      .where(eq(staffRolePermission.roleId, id));

    const rows = Object.entries(permissions).flatMap(([resource, actions]) =>
      actions.map((action) => ({ roleId: id, resource, action })),
    );

    if (rows.length > 0) {
      await tx.insert(staffRolePermission).values(rows);
    }
  });

  invalidatePermissionCache(role.key);
}

/**
 * Assigns roles to a staff member.
 *
 * Deliberately *not* Better Auth's `admin.setRole`. That endpoint validates
 * against its static `roles` config — `if (opts.roles && !opts.roles[role])`
 * in `plugins/admin/routes.mjs` — so any role created from the panel is
 * rejected with "non-existent role value".
 *
 * We cannot drop that config either: the plugin validates `adminRoles`
 * against it at startup and throws without it. So the config stays for
 * bootstrapping, and assignment is done here against `staff_role`, which is
 * the actual source of truth.
 */
export async function assignRoles(userId: string, roleKeys: string[]) {
  if (roleKeys.length === 0) {
    throw conflict("A staff member must hold at least one role.");
  }

  const known = await db
    .select({ key: staffRole.key })
    .from(staffRole)
    .where(inArray(staffRole.key, roleKeys));

  const knownKeys = new Set(known.map((r) => r.key));
  const unknown = roleKeys.filter((key) => !knownKeys.has(key));

  if (unknown.length > 0) {
    throw conflict(`Unknown role(s): ${unknown.join(", ")}`);
  }

  const [user] = await db
    .select({ id: staffUser.id })
    .from(staffUser)
    .where(eq(staffUser.id, userId))
    .limit(1);

  if (!user) {
    throw notFound("Staff member");
  }

  // Comma-joined, matching how Better Auth reads the column back.
  await db
    .update(staffUser)
    .set({ role: roleKeys.join(",") })
    .where(eq(staffUser.id, userId));
}

export async function deleteRole(id: string) {
  const role = await requireRole(id);

  if (role.isSystem) {
    throw conflict(`"${role.label}" is a system role and cannot be deleted.`);
  }

  const counts = await memberCounts();
  const assigned = counts.get(role.key) ?? 0;

  if (assigned > 0) {
    throw conflict(
      `${assigned} staff member(s) still hold this role. Reassign them first.`,
    );
  }

  // staff_role_permission cascades on the FK.
  await db.delete(staffRole).where(eq(staffRole.id, id));

  invalidatePermissionCache(role.key);
}
