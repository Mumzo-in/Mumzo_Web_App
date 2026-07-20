import { adminAuth } from "@mumzo/auth";
import { db } from "@mumzo/db";
import { staffUser } from "@mumzo/db/schema/staff";
import { eq } from "drizzle-orm";

import { conflict, forbidden, notFound } from "@/core/errors";
import {
  assertCanActOnTarget,
  countSuperadmins,
  isSuperadmin,
} from "./protection";

async function requireTarget(id: string) {
  const [target] = await db
    .select({ id: staffUser.id, email: staffUser.email, role: staffUser.role })
    .from(staffUser)
    .where(eq(staffUser.id, id))
    .limit(1);

  if (!target) {
    throw notFound("Staff member");
  }

  return target;
}

/**
 * Deleting a staff account.
 *
 * Deliberately not Better Auth's `admin.removeUser`. That endpoint guards on
 * `user:delete` — a *customer* permission that our `admin` role inherits from
 * the plugin's default grants. Using it would let an admin delete staff
 * accounts despite `admin` having no `staff` grants at all.
 *
 * `staff_session` and `staff_account` cascade on their foreign keys, so the
 * delete also revokes every active session for that user.
 */
export async function deleteStaff(
  id: string,
  actor: { id: string; role?: string | null },
) {
  if (id === actor.id) {
    throw conflict(
      "You cannot delete your own account. Ask another admin to do it.",
    );
  }

  const target = await requireTarget(id);

  assertCanActOnTarget(actor.role, target.role, "delete");

  if (isSuperadmin(target.role) && (await countSuperadmins()) <= 1) {
    throw forbidden(
      "This is the only Super Admin. Promote another account before deleting this one.",
    );
  }

  await db.delete(staffUser).where(eq(staffUser.id, id));

  return { email: target.email };
}

/**
 * Ban / unban.
 *
 * Not `authClient.admin.banUser` called directly from the browser — that
 * endpoint checks only `user:ban`, which `admin` also inherits, and nothing
 * about the target's role. Routed through here so the superadmin-only rule
 * applies regardless of which client calls it.
 */
export async function banStaff(
  id: string,
  actor: { id: string; role?: string | null },
  reason?: string,
) {
  if (id === actor.id) {
    throw conflict("You cannot ban your own account.");
  }

  const target = await requireTarget(id);

  assertCanActOnTarget(actor.role, target.role, "ban");

  if (isSuperadmin(target.role) && (await countSuperadmins()) <= 1) {
    throw forbidden(
      "This is the only Super Admin. Promote another account before banning this one.",
    );
  }

  await adminAuth.api.banUser({
    body: { userId: id, banReason: reason },
  });
}

export async function unbanStaff(
  id: string,
  actor: { id: string; role?: string | null },
) {
  const target = await requireTarget(id);

  assertCanActOnTarget(actor.role, target.role, "unban");

  await adminAuth.api.unbanUser({ body: { userId: id } });
}
