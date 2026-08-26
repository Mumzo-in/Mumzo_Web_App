import { randomBytes } from "node:crypto";
import { db, deliveryLink } from "@mumzo/db";
import { and, desc, eq, isNull } from "drizzle-orm";

/**
 * Link minting, kept in its own leaf module.
 *
 * The admin order service calls this on dispatch, while `delivery.service`
 * reads back the orders it points at — importing this from either side would
 * otherwise close a cycle between the two.
 */

function newToken() {
  return randomBytes(24).toString("base64url");
}

/**
 * Mint (or reuse) the link for an order. Reuses an existing *unspent* link so
 * re-opening the share dialog hands out the same URL — a rider who already
 * has the link is not invalidated because ops clicked twice.
 */
export async function issueDeliveryLink(orderId: string, riderId: string) {
  const [existing] = await db
    .select()
    .from(deliveryLink)
    .where(and(eq(deliveryLink.orderId, orderId), isNull(deliveryLink.outcome)))
    .limit(1);

  if (existing) {
    // Re-dispatching to a different rider re-points the same live link.
    if (existing.riderId !== riderId) {
      const [moved] = await db
        .update(deliveryLink)
        .set({ riderId })
        .where(eq(deliveryLink.id, existing.id))
        .returning();
      return moved ?? existing;
    }
    return existing;
  }

  const [created] = await db
    .insert(deliveryLink)
    .values({ orderId, token: newToken(), riderId })
    .returning();

  return created;
}

/** The most recent link for an order, spent or not. */
export async function getDeliveryLinkForOrder(orderId: string) {
  const [row] = await db
    .select()
    .from(deliveryLink)
    .where(eq(deliveryLink.orderId, orderId))
    .orderBy(desc(deliveryLink.createdAt))
    .limit(1);
  return row ?? null;
}
