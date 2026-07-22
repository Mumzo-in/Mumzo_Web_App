import { db } from "@mumzo/db";
import { staffRole, staffRolePermission } from "@mumzo/db/schema/staff";
import { eq } from "drizzle-orm";

import { ROLE_SEEDS } from "../permissions";

/**
 * Adds grants a system role's seed defines but the database row doesn't have
 * yet — the case when `ROLE_SEEDS` gains a resource (e.g. `brand`, `hub`)
 * after a role was already seeded. `seedRoles()` only inserts roles that
 * don't exist at all, so an existing `superadmin` row never picks up a newly
 * added resource on its own.
 *
 * Strictly additive: only inserts (roleId, resource, action) rows missing
 * from `staff_role_permission`. Never touches non-system roles — those are
 * operator-created and their grants are the operator's to manage. Safe to
 * run on every `bun seed`.
 */
export async function backfillGrants() {
  const roles = await db
    .select({
      id: staffRole.id,
      key: staffRole.key,
      isSystem: staffRole.isSystem,
    })
    .from(staffRole);

  let added = 0;

  for (const seed of ROLE_SEEDS) {
    const role = roles.find((r) => r.key === seed.key && r.isSystem);
    if (!role) {
      continue;
    }

    const existing = await db
      .select({
        resource: staffRolePermission.resource,
        action: staffRolePermission.action,
      })
      .from(staffRolePermission)
      .where(eq(staffRolePermission.roleId, role.id));

    const existingKeys = new Set(
      existing.map((row) => `${row.resource}:${row.action}`),
    );

    const missing = Object.entries(seed.permissions).flatMap(
      ([resource, actions]) =>
        actions
          .filter((action) => !existingKeys.has(`${resource}:${action}`))
          .map((action) => ({ roleId: role.id, resource, action })),
    );

    if (missing.length > 0) {
      await db.insert(staffRolePermission).values(missing);
      added += missing.length;
    }
  }

  return { added };
}
