import { db, deliveryLink, order, orderStatusLog, rider } from "@mumzo/db";
import { notify } from "@mumzo/notifications";
import { ROOMS, realtime } from "@mumzo/realtime";
import { eq } from "drizzle-orm";
import { badRequest, forbidden, notFound } from "@/core/errors";

import {
  getOrder as getAdminOrder,
  handleOrderStatusSideEffects,
} from "@/modules/admin/v1/orders/orders.service";

export { issueDeliveryLink } from "./delivery-link";

/**
 * Public delivery links — the rider-facing surface.
 *
 * These handlers are deliberately unauthenticated: the URL `token` addresses
 * the delivery and the rider's own `accessCode` authorises it. Because anyone
 * can hit them, every response here is minimised to what a courier needs at
 * the door, and nothing identifies the customer until the code is verified.
 */

/** Wrong-code attempts before a link stops accepting codes entirely. Ops has
 * to mint a fresh link at that point, which also invalidates the leaked one. */
const MAX_FAILED_ATTEMPTS = 10;

/** Outcomes a rider may report, and the order status each writes. */
const OUTCOME_STATUS = {
  delivered: "delivered",
  cancelled: "cancelled",
  returned: "returned",
} as const;

export type DeliveryOutcome = keyof typeof OUTCOME_STATUS;

async function loadLink(token: string) {
  const [row] = await db
    .select()
    .from(deliveryLink)
    .where(eq(deliveryLink.token, token))
    .limit(1);

  if (!row) {
    throw notFound("Delivery link");
  }
  return row;
}

/**
 * Pre-unlock view. Reveals only whether the link is live and already spent —
 * never customer data — so an unguessed token leaks nothing.
 */
export async function getDeliveryLinkStatus(token: string) {
  const link = await loadLink(token);
  return {
    token: link.token,
    locked: link.riderId === null,
    outcome: link.outcome as DeliveryOutcome | null,
    lockedOut: link.failedAttempts >= MAX_FAILED_ATTEMPTS,
  };
}

/** Resolve a rider by their standing code. */
async function riderForCode(code: string) {
  const trimmed = code.trim();
  if (!trimmed) {
    return null;
  }
  const [match] = await db
    .select({ id: rider.id, name: rider.name, status: rider.status })
    .from(rider)
    .where(eq(rider.accessCode, trimmed))
    .limit(1);
  return match ?? null;
}

/**
 * Exchange a rider's access code for the delivery details.
 *
 * The first rider to unlock a link is bound to it permanently — that binding
 * is the audit record of who handled the order. A different code later still
 * returns the details (the delivery may legitimately change hands) but does
 * not overwrite the original attribution.
 */
export async function unlockDeliveryLink(token: string, code: string) {
  const link = await loadLink(token);

  if (link.failedAttempts >= MAX_FAILED_ATTEMPTS) {
    throw forbidden("This link is locked. Ask ops to send a fresh one.");
  }

  const match = await riderForCode(code);

  if (!match) {
    await db
      .update(deliveryLink)
      .set({ failedAttempts: link.failedAttempts + 1 })
      .where(eq(deliveryLink.id, link.id));
    throw forbidden("That code is not recognised.");
  }

  if (match.status === "inactive") {
    throw forbidden("This rider account is inactive.");
  }

  // The link is assigned to one rider at dispatch. A valid code belonging to
  // somebody else must not open it, or the assignment would carry no weight.
  if (link.riderId !== null && link.riderId !== match.id) {
    await db
      .update(deliveryLink)
      .set({ failedAttempts: link.failedAttempts + 1 })
      .where(eq(deliveryLink.id, link.id));
    throw forbidden("This delivery is assigned to a different rider.");
  }

  if (link.unlockedAt === null) {
    await db
      .update(deliveryLink)
      .set({ riderId: match.id, unlockedAt: new Date(), failedAttempts: 0 })
      .where(eq(deliveryLink.id, link.id));
  }

  return buildRun(link.token, link.orderId, match.id);
}

/** Full rider payload. Only ever reached after a code check. */
async function buildRun(token: string, orderId: string, riderId: string) {
  const detail = await getAdminOrder(orderId);
  const [link] = await db
    .select()
    .from(deliveryLink)
    .where(eq(deliveryLink.token, token))
    .limit(1);

  const [assigned] = link?.riderId
    ? await db
        .select({ name: rider.name })
        .from(rider)
        .where(eq(rider.id, link.riderId))
        .limit(1)
    : [];

  return {
    token,
    orderId: detail.id,
    status: (link?.outcome ?? "out_for_delivery") as
      | "out_for_delivery"
      | DeliveryOutcome,
    riderId,
    riderName: assigned?.name ?? null,
    customerName: detail.addressName || detail.customerName,
    customerPhone: detail.addressPhone,
    addressLabel: detail.addressLabel,
    addressLine1: detail.addressLine1,
    addressLine2: detail.addressLine2,
    addressLandmark: detail.addressLandmark,
    addressCity: detail.addressCity,
    addressPincode: detail.addressPincode,
    latitude: null,
    longitude: null,
    hubName: detail.hubName,
    itemCount: detail.items.reduce((sum, item) => sum + item.qty, 0),
    items: detail.items.map((item) => ({
      id: item.id,
      name: item.name,
      variantLabel: item.variantLabel,
      qty: item.qty,
    })),
    total: detail.total,
    paymentMethod: detail.paymentMethod,
    collectCash:
      detail.paymentMethod === "cod" && detail.paymentStatus !== "paid",
    dispatchedAt: detail.placedAt,
    completedAt: link?.outcomeAt?.toISOString() ?? null,
    completionReason: link?.outcomeReason ?? null,
  };
}

/** Re-read a link the rider has already unlocked, using their code again —
 * the page holds no session, so every load re-presents the code. */
export async function getDeliveryRun(token: string, code: string) {
  return unlockDeliveryLink(token, code);
}

/**
 * Record the rider's outcome. This both spends the link and moves the order,
 * in one transaction so the board can never disagree with the link.
 */
export async function completeDeliveryRun(
  token: string,
  code: string,
  outcome: DeliveryOutcome,
  reason?: string,
) {
  const link = await loadLink(token);

  if (link.outcome) {
    throw badRequest("This delivery has already been closed.");
  }

  const match = await riderForCode(code);
  if (!match) {
    throw forbidden("That code is not recognised.");
  }
  if (link.riderId !== null && link.riderId !== match.id) {
    throw forbidden("This delivery is assigned to a different rider.");
  }

  const [current] = await db
    .select({ status: order.status, userId: order.userId })
    .from(order)
    .where(eq(order.id, link.orderId))
    .limit(1);

  if (!current) {
    throw notFound("Order");
  }
  if (current.status !== "out_for_delivery") {
    throw badRequest(
      `This order is "${current.status}" and can no longer be updated from the delivery link.`,
    );
  }

  const nextStatus = OUTCOME_STATUS[outcome];
  const actor = `rider:${match.id}`;

  await db.transaction(async (tx) => {
    await tx
      .update(order)
      .set({ status: nextStatus })
      .where(eq(order.id, link.orderId));

    await tx.insert(orderStatusLog).values({
      orderId: link.orderId,
      fromStatus: current.status,
      toStatus: nextStatus,
      actor,
      note: reason ?? null,
    });

    await tx
      .update(deliveryLink)
      .set({
        outcome,
        outcomeReason: reason ?? null,
        outcomeAt: new Date(),
        riderId: link.riderId ?? match.id,
      })
      .where(eq(deliveryLink.id, link.id));
  });

  // Best-effort fan-out — the status change has already committed, so none of
  // these may fail the rider's update. The board listens on
  // `order.status_updated`, so that is published too rather than only the
  // rider-specific event.
  realtime
    .publish(ROOMS.adminOrders, "order.status_updated", {
      orderId: link.orderId,
      fromStatus: current.status,
      toStatus: nextStatus,
    })
    .catch((error) => {
      console.error(
        `Failed to publish order.status_updated for ${link.orderId}:`,
        error,
      );
    });

  realtime
    .publish(ROOMS.adminOrders, "delivery.completed", {
      orderId: link.orderId,
      outcome,
      riderId: match.id,
      riderName: match.name ?? null,
      reason: reason ?? null,
    })
    .catch((error) => {
      console.error(
        `Failed to publish delivery.completed for ${link.orderId}:`,
        error,
      );
    });

  if (current.userId) {
    notify
      .send({
        userId: current.userId,
        templateId: "order.status_updated",
        data: { orderId: link.orderId, status: nextStatus },
      })
      .catch((error) => {
        console.error(
          `Failed to enqueue notification for order ${link.orderId}:`,
          error,
        );
      });

    // Referral settlement and review prompts key off `delivered`/`returned`,
    // and must fire whether the order was closed by staff or by a rider.
    void handleOrderStatusSideEffects(current.userId, link.orderId, nextStatus);
  }

  return buildRun(token, link.orderId, match.id);
}
