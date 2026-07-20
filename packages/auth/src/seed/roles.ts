import { db } from "@mumzo/db";
import { staffRole, staffRolePermission } from "@mumzo/db/schema/staff";
import { inArray } from "drizzle-orm";

import { ROLE_SEEDS } from "../permissions";

/**
 * Seeds the base roles from `ROLE_SEEDS`.
 *
 * Idempotent, and deliberately non-destructive: an existing role key is left
 * exactly as it is, grants included. Re-running must never revert permissions
 * an operator has edited in the panel — that would make `bun seed` a
 * data-loss command.
 *
 * Use `bun db:reset` when you want the seeded defaults back.
 */
export async function seedRoles() {
  const keys = ROLE_SEEDS.map((role) => role.key);

  const existing = await db
    .select({ key: staffRole.key })
    .from(staffRole)
    .where(inArray(staffRole.key, keys));

  const present = new Set(existing.map((row) => row.key));
  const missing = ROLE_SEEDS.filter((role) => !present.has(role.key));

  if (missing.length === 0) {
    return { created: 0, skipped: ROLE_SEEDS.length };
  }

  // One transaction: a role without its grants is worse than no role — it
  // would exist, be assignable, and silently permit nothing.
  await db.transaction(async (tx) => {
    for (const seed of missing) {
      const id = `role_${crypto.randomUUID()}`;

      await tx.insert(staffRole).values({
        id,
        key: seed.key,
        label: seed.label,
        description: seed.description,
        isSystem: true,
      });

      const grants = Object.entries(seed.permissions).flatMap(
        ([resource, actions]) =>
          actions.map((action) => ({ roleId: id, resource, action })),
      );

      if (grants.length > 0) {
        await tx.insert(staffRolePermission).values(grants);
      }
    }
  });

  return {
    created: missing.length,
    skipped: ROLE_SEEDS.length - missing.length,
  };
}
