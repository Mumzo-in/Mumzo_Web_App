import { db } from "@mumzo/db";
import { order } from "@mumzo/db/schema/commerce";
import { orderReview } from "@mumzo/db/schema/reviews";
import { and, asc, count, eq, isNull } from "drizzle-orm";

/** Pure data access — no business rules. `reviews.service.ts` owns those. */

export async function findByOrderId(orderId: string) {
  const [row] = await db
    .select()
    .from(orderReview)
    .where(eq(orderReview.orderId, orderId))
    .limit(1);
  return row ?? null;
}

export async function insertPending(orderId: string, userId: string) {
  const [row] = await db
    .insert(orderReview)
    .values({ orderId, userId })
    .onConflictDoNothing()
    .returning();
  return row ?? (await findByOrderId(orderId));
}

export async function markNotified(id: string) {
  await db
    .update(orderReview)
    .set({ notifiedAt: new Date() })
    .where(eq(orderReview.id, id));
}

/** How many delivered orders this user has (used to decide whether they're
 * still within their "first 5" or should be throttled). */
export async function countDeliveredOrders(userId: string) {
  const [row] = await db
    .select({ value: count() })
    .from(order)
    .where(and(eq(order.userId, userId), eq(order.status, "delivered")));
  return row?.value ?? 0;
}

/** The single oldest un-responded review row for this user — "one at a
 * time", oldest delivered order first. Once rated, a row never surfaces
 * here again regardless of what happens with the referral nudge after. */
export async function findNextPendingForUser(userId: string) {
  const [row] = await db
    .select()
    .from(orderReview)
    .where(and(eq(orderReview.userId, userId), isNull(orderReview.respondedAt)))
    .orderBy(asc(orderReview.createdAt))
    .limit(1);
  return row ?? null;
}

export async function submitRating(input: {
  id: string;
  rating: number;
  comment: string | null;
}) {
  await db
    .update(orderReview)
    .set({
      rating: input.rating,
      comment: input.comment,
      respondedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(orderReview.id, input.id));
}

export async function markReferralPromptShown(id: string) {
  await db
    .update(orderReview)
    .set({ referralPromptShown: true, updatedAt: new Date() })
    .where(eq(orderReview.id, id));
}

export async function markReferralPromptSkipped(id: string) {
  await db
    .update(orderReview)
    .set({ referralPromptSkipped: true, updatedAt: new Date() })
    .where(eq(orderReview.id, id));
}

/** Rows still awaiting their delivery notification — the sweep's work
 * queue. Oldest first so a backlog drains in order. */
export async function findUnnotified(limit: number) {
  return db
    .select()
    .from(orderReview)
    .where(isNull(orderReview.notifiedAt))
    .orderBy(asc(orderReview.createdAt))
    .limit(limit);
}
