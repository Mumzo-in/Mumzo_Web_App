import { db } from "@mumzo/db";
import { staffUser } from "@mumzo/db/schema/staff";

import { forbidden } from "@/core/errors";

/**
 * Rules that hold for every action against a staff account — ban, unban,
 * delete, and later ones like force-signout.
 *
 * Only a superadmin may act on a superadmin. Without this, any role holding
 * `staff:*` or the admin plugin's `user:ban` (which `admin` inherits — see
 * `service.ts`) could disable or remove the very accounts meant to be the
 * highest tier. The permission system would technically allow it and still
 * be a privilege-escalation bug.
 */

export function roleKeys(role: string | null | undefined): string[] {
  return (role ?? "")
    .split(",")
    .map((key) => key.trim())
    .filter(Boolean);
}

export const isSuperadmin = (role: string | null | undefined) =>
  roleKeys(role).includes("superadmin");

/**
 * Throws unless the actor is a superadmin, when the target holds the
 * superadmin role. Call before any mutating action on a staff account.
 */
export function assertCanActOnTarget(
  actorRole: string | null | undefined,
  targetRole: string | null | undefined,
  action: "ban" | "unban" | "delete",
) {
  if (isSuperadmin(targetRole) && !isSuperadmin(actorRole)) {
    throw forbidden(
      `Only a Super Admin can ${action} another Super Admin's account.`,
    );
  }
}

/** Staff currently holding `superadmin`, across possibly-comma-joined roles. */
export async function countSuperadmins() {
  const rows = await db.select({ role: staffUser.role }).from(staffUser);

  return rows.filter((row) => isSuperadmin(row.role)).length;
}
