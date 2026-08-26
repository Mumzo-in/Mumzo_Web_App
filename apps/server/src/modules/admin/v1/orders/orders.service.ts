import { db } from "@mumzo/db";
import { user } from "@mumzo/db/schema/auth";
import {
  hub,
  inventory,
  product,
  productColor,
  productSize,
} from "@mumzo/db/schema/catalog";
import {
  order,
  orderItem,
  orderStatusLog,
  payment,
} from "@mumzo/db/schema/commerce";
import { rider } from "@mumzo/db/schema/delivery";
import { notify } from "@mumzo/notifications";
import { ROOMS, realtime } from "@mumzo/realtime";
import { and, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import type { Context } from "hono";
import type { z } from "zod";
import { logActivity } from "@/core";
import { badRequest, notFound } from "@/core/errors";
import type { AppEnv } from "@/core/types";
import { toWholeRupees } from "@/lib/money";
import {
  getDeliveryLinkForOrder,
  issueDeliveryLink,
} from "@/modules/platform/v1/delivery/delivery-link";
import {
  onFirstOrderPlaced,
  onOrderDelivered,
  onOrderReturned,
} from "@/modules/platform/v1/referrals/referrals.service";
import { onOrderDelivered as onOrderDeliveredForReview } from "@/modules/platform/v1/reviews/reviews.service";
import { computeCartTotals, resolveLine } from "@/shared/pricing";
import type { createOrderSchema } from "./orders.schema";

function toAdminOrderItem(row: {
  id: string;
  productId: string;
  nameSnapshot: string;
  variantLabelSnapshot: string | null;
  priceSnapshot: number;
  qty: number;
}) {
  return {
    id: row.id,
    productId: row.productId,
    name: row.nameSnapshot,
    variantLabel: row.variantLabelSnapshot,
    price: toWholeRupees(row.priceSnapshot),
    qty: row.qty,
  };
}

/**
 * Manual order creation for phone/walk-in customers — no cart, no
 * geolocation. Staff pick the hub and line items directly; pricing/GST/HSN
 * snapshots are resolved the same way `placeOrder` does (variant row wins
 * over the parent product — see `resolveLine`), and stock is checked
 * against that hub's `inventory` row for each line.
 */
export async function createOrder(
  input: z.infer<typeof createOrderSchema>,
  actor: string,
  c?: Context<AppEnv>,
) {
  const [hubRow] = await db
    .select({ id: hub.id, name: hub.name })
    .from(hub)
    .where(and(eq(hub.id, input.hubId), eq(hub.isActive, true)))
    .limit(1);
  if (!hubRow) {
    throw badRequest("Selected hub is not active.");
  }

  const productIds = [...new Set(input.items.map((line) => line.productId))];
  const products = await db
    .select()
    .from(product)
    .where(inArray(product.id, productIds));
  const productById = new Map(products.map((p) => [p.id, p]));

  const sizeIds = input.items
    .map((line) => line.productSizeId)
    .filter((id): id is string => Boolean(id));
  const sizes =
    sizeIds.length > 0
      ? await db
          .select()
          .from(productSize)
          .where(inArray(productSize.id, sizeIds))
      : [];
  const sizeById = new Map(sizes.map((s) => [s.id, s]));

  const colorIds = input.items
    .map((line) => line.productColorId)
    .filter((id): id is string => Boolean(id));
  const colors =
    colorIds.length > 0
      ? await db
          .select()
          .from(productColor)
          .where(inArray(productColor.id, colorIds))
      : [];
  const colorById = new Map(colors.map((cl) => [cl.id, cl]));

  const stockRows = await db
    .select({
      productId: inventory.productId,
      productSizeId: inventory.productSizeId,
      productColorId: inventory.productColorId,
      stock: inventory.stock,
    })
    .from(inventory)
    .where(
      and(
        eq(inventory.hubId, hubRow.id),
        inArray(inventory.productId, productIds),
      ),
    );
  const stockByKey = new Map(
    stockRows.map((r) => [
      `${r.productId}:${r.productSizeId ?? ""}:${r.productColorId ?? ""}`,
      r.stock,
    ]),
  );

  const lines = input.items.map((line) => {
    const productRow = productById.get(line.productId);
    if (!productRow) {
      throw badRequest(`Product ${line.productId} not found.`);
    }
    const sizeRow = line.productSizeId
      ? (sizeById.get(line.productSizeId) ?? null)
      : null;
    const colorRow = line.productColorId
      ? (colorById.get(line.productColorId) ?? null)
      : null;
    const resolved = resolveLine(productRow, sizeRow, colorRow);
    const stockKey = `${line.productId}:${line.productSizeId ?? ""}:${line.productColorId ?? ""}`;
    const stock = stockByKey.get(stockKey) ?? 0;
    if (line.qty > stock) {
      throw badRequest(
        `${productRow.name}${sizeRow ? ` (${sizeRow.label})` : colorRow ? ` (${colorRow.label})` : ""} has only ${stock} in stock at ${hubRow.name}.`,
      );
    }
    return {
      productId: line.productId,
      productSizeId: line.productSizeId ?? null,
      productColorId: line.productColorId ?? null,
      nameSnapshot: productRow.name,
      variantLabel: sizeRow?.label ?? colorRow?.label ?? null,
      price: resolved.price,
      gstRate: resolved.gstRate,
      hsn: resolved.hsn,
      weightGrams: resolved.weightGrams,
      qty: line.qty,
    };
  });

  const totals = computeCartTotals(lines);

  const orderId = await db.transaction(async (tx) => {
    const [orderRow] = await tx
      .insert(order)
      .values({
        userId: input.customerId ?? actor,
        hubId: hubRow.id,
        status: "confirmed",
        addressLabel: input.addressLabel,
        addressName: input.customerName,
        addressPhone: input.customerPhone,
        addressLine1: input.addressLine1,
        addressLine2: input.addressLine2 ?? "",
        addressLandmark: input.addressLandmark ?? null,
        addressPincode: input.addressPincode,
        addressCity: input.addressCity,
        subtotal: totals.subtotal,
        gstAmount: totals.gstAmount,
        deliveryFee: totals.deliveryFee,
        discount: totals.discount,
        total: totals.total,
        idempotencyKey: crypto.randomUUID(),
      })
      .returning({ id: order.id });

    if (!orderRow) {
      throw new Error("Insert into order returned no row.");
    }

    await tx.insert(orderItem).values(
      lines.map((line) => ({
        orderId: orderRow.id,
        productId: line.productId,
        productSizeId: line.productSizeId,
        productColorId: line.productColorId,
        nameSnapshot: line.nameSnapshot,
        variantLabelSnapshot: line.variantLabel,
        priceSnapshot: line.price,
        gstRateSnapshot: line.gstRate,
        hsnSnapshot: line.hsn ?? "",
        weightGramsSnapshot: line.weightGrams,
        qty: line.qty,
      })),
    );

    await tx.insert(orderStatusLog).values([
      {
        orderId: orderRow.id,
        fromStatus: null,
        toStatus: "confirmed",
        actor,
        note: input.note ?? "Manual order created by staff.",
      },
    ]);

    await tx.insert(payment).values({
      orderId: orderRow.id,
      provider: "cod",
      status: "cod_pending",
      amount: totals.total,
      method: "cod",
    });

    if (c) {
      await logActivity({
        c,
        action: "order.create",
        entityType: "order",
        entityId: orderRow.id,
        description: `Created manual order for ${input.customerName} (${totals.total} paise) at hub "${hubRow.name}"`,
        newValues: { hubId: hubRow.id, total: totals.total },
        tx,
      });
    }

    return orderRow.id;
  });

  realtime
    .publish(ROOMS.adminOrders, "order.created", {
      orderId,
      hubId: hubRow.id,
      total: totals.total,
      addressName: input.customerName,
    })
    .catch((error) => {
      console.error(`Failed to publish order.created for ${orderId}:`, error);
    });

  if (input.customerId) {
    notify
      .send({
        userId: input.customerId,
        templateId: "order.status_updated",
        data: { orderId, status: "confirmed" },
      })
      .catch((error) => {
        console.error(
          `Failed to enqueue notification for order ${orderId}:`,
          error,
        );
      });
  }

  return getOrder(orderId);
}

export async function listOrders(filters: {
  page: number;
  limit: number;
  status?: string;
  hubId?: string;
  search?: string;
}) {
  const offset = (filters.page - 1) * filters.limit;

  const conditions = [
    filters.status ? eq(order.status, filters.status) : undefined,
    filters.hubId ? eq(order.hubId, filters.hubId) : undefined,
    filters.search
      ? or(
          ilike(order.addressName, `%${filters.search}%`),
          ilike(order.addressPhone, `%${filters.search}%`),
          eq(order.id, filters.search),
        )
      : undefined,
  ].filter((c): c is NonNullable<typeof c> => c !== undefined);
  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const rows = await db
    .select({
      id: order.id,
      status: order.status,
      addressName: order.addressName,
      hubName: hub.name,
      total: order.total,
      paymentMethod: payment.method,
      placedAt: order.placedAt,
    })
    .from(order)
    .innerJoin(hub, eq(order.hubId, hub.id))
    .leftJoin(payment, eq(payment.orderId, order.id))
    .where(where)
    .orderBy(desc(order.placedAt))
    .limit(filters.limit)
    .offset(offset);

  const [countRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(order)
    .where(where);
  const count = countRow?.count ?? 0;

  const orderIds = rows.map((r) => r.id);
  const itemCounts = new Map<string, number>();
  if (orderIds.length > 0) {
    const counts = await db
      .select({
        orderId: orderItem.orderId,
        count: sql<number>`count(*)::int`,
      })
      .from(orderItem)
      .where(inArray(orderItem.orderId, orderIds))
      .groupBy(orderItem.orderId);
    for (const c of counts) {
      itemCounts.set(c.orderId, c.count);
    }
  }

  return {
    data: rows.map((row) => ({
      id: row.id,
      status: row.status,
      customerName: row.addressName,
      hubName: row.hubName,
      itemCount: itemCounts.get(row.id) ?? 0,
      total: toWholeRupees(row.total),
      paymentMethod: row.paymentMethod ?? "cod",
      placedAt: row.placedAt.toISOString(),
    })),
    meta: {
      page: filters.page,
      limit: filters.limit,
      total: count,
      hasNext: filters.page * filters.limit < count,
    },
  };
}

export async function getOrder(orderId: string) {
  const [row] = await db
    .select({
      order,
      hubName: hub.name,
      customerId: user.id,
      customerName: user.name,
      paymentMethod: payment.method,
      paymentStatus: payment.status,
    })
    .from(order)
    .innerJoin(hub, eq(order.hubId, hub.id))
    .innerJoin(user, eq(order.userId, user.id))
    .leftJoin(payment, eq(payment.orderId, order.id))
    .where(eq(order.id, orderId))
    .limit(1);
  if (!row) {
    throw notFound("Order");
  }

  const items = await db
    .select()
    .from(orderItem)
    .where(eq(orderItem.orderId, orderId));

  const statusLog = await db
    .select()
    .from(orderStatusLog)
    .where(eq(orderStatusLog.orderId, orderId))
    .orderBy(orderStatusLog.createdAt);

  return {
    id: row.order.id,
    status: row.order.status,
    customerId: row.customerId,
    customerName: row.customerName,
    hubName: row.hubName,
    addressLabel: row.order.addressLabel,
    addressName: row.order.addressName,
    addressPhone: row.order.addressPhone,
    addressLine1: row.order.addressLine1,
    addressLine2: row.order.addressLine2,
    addressLandmark: row.order.addressLandmark,
    addressPincode: row.order.addressPincode,
    addressCity: row.order.addressCity,
    subtotal: toWholeRupees(row.order.subtotal),
    gstAmount: toWholeRupees(row.order.gstAmount),
    deliveryFee: toWholeRupees(row.order.deliveryFee),
    discount: toWholeRupees(row.order.discount),
    total: toWholeRupees(row.order.total),
    paymentMethod: row.paymentMethod ?? "cod",
    paymentStatus: row.paymentStatus ?? "cod_pending",
    items: items.map(toAdminOrderItem),
    statusLog: statusLog.map((log) => ({
      id: log.id,
      fromStatus: log.fromStatus,
      toStatus: log.toStatus,
      actor: log.actor,
      note: log.note,
      createdAt: log.createdAt.toISOString(),
    })),
    placedAt: row.order.placedAt.toISOString(),
  };
}

/** Legal forward transitions per docs/order-checkout-flow.md's status graph.
 * Terminal states (delivered/cancelled/returned) have no further moves.
 *
 * `shipped` is an *optional* step: a 10-minute hub delivery hands a packed
 * order straight to a rider with no separate shipping leg, so `packed` may go
 * directly to `out_for_delivery`. Longer-haul orders still pass through
 * `shipped`. Note this skips only that one step — `out_for_delivery` stays
 * mandatory, since dispatch is what mints the rider's delivery link. */
const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  pending_payment: ["confirmed", "cancelled"],
  confirmed: ["packed", "cancelled"],
  packed: ["shipped", "out_for_delivery", "cancelled"],
  shipped: ["out_for_delivery", "cancelled"],
  // `returned` covers a rider bringing goods back from the door (damaged,
  // refused, wrong item) — a real outcome of a delivery run, distinct from a
  // post-delivery `return_requested` raised by the customer later.
  out_for_delivery: ["delivered", "cancelled", "returned"],
  delivered: ["return_requested"],
  return_requested: ["returned", "delivered"],
  returned: [],
  cancelled: [],
};

export async function updateOrderStatus(
  orderId: string,
  input: { status: string; note?: string; riderId?: string },
  actor: string,
  c?: Context<AppEnv>,
) {
  const [row] = await db
    .select({ id: order.id, status: order.status, userId: order.userId })
    .from(order)
    .where(eq(order.id, orderId))
    .limit(1);
  if (!row) {
    throw notFound("Order");
  }

  const allowed = ALLOWED_TRANSITIONS[row.status] ?? [];
  if (!allowed.includes(input.status)) {
    throw badRequest(
      `Cannot move an order from "${row.status}" to "${input.status}".`,
    );
  }

  // Dispatching mints the rider link, so ops always has one to share the
  // moment the order lands in `out_for_delivery`. Idempotent — re-dispatching
  // reuses the open link rather than invalidating one already sent out.
  if (input.status === "out_for_delivery") {
    if (!input.riderId) {
      throw badRequest("Choose a rider before dispatching this order.");
    }
    await issueDeliveryLink(orderId, input.riderId);
  }

  await db.transaction(async (tx) => {
    await tx
      .update(order)
      .set({ status: input.status })
      .where(eq(order.id, orderId));
    await tx.insert(orderStatusLog).values({
      orderId,
      fromStatus: row.status,
      toStatus: input.status,
      actor,
      note: input.note ?? null,
    });

    if (c) {
      await logActivity({
        c,
        action: "order.update_status",
        entityType: "order",
        entityId: orderId,
        description: `Changed status of order ${orderId} from "${row.status}" to "${input.status}"`,
        previousValues: { status: row.status },
        newValues: { status: input.status, note: input.note },
        tx,
      });
    }
  });

  // Best-effort — neither call must fail the status update that already
  // committed. notify.send() only enqueues (fast Redis round-trip, not a
  // wait on delivery); realtime.publish() is a fire-and-forget in-memory fan-out.
  if (row.userId) {
    notify
      .send({
        userId: row.userId,
        templateId: "order.status_updated",
        data: { orderId, status: input.status },
      })
      .catch((error) => {
        console.error(
          `Failed to enqueue notification for order ${orderId}:`,
          error,
        );
      });
  }

  realtime
    .publish(ROOMS.adminOrders, "order.status_updated", {
      orderId,
      fromStatus: row.status,
      toStatus: input.status,
    })
    .catch((error) => {
      console.error(
        `Failed to publish order.status_updated for ${orderId}:`,
        error,
      );
    });

  // Best-effort side effects (referral funnel + review prompts) — neither
  // must ever fail an order-status update that already committed.
  if (row.userId) {
    void handleOrderStatusSideEffects(row.userId, orderId, input.status);
  }

  return getOrder(orderId);
}

/** Best-effort side effects fired after an order status transition commits.
 * Each hook gets its own try/catch — referrals and review prompts are
 * unrelated concerns, so one failing must never block the other.
 *
 * Exported because the public delivery link closes orders too: a rider
 * marking an order delivered must settle referrals and queue the review
 * prompt exactly as a staff move would. */
export async function handleOrderStatusSideEffects(
  userId: string,
  orderId: string,
  status: string,
) {
  try {
    if (status === "confirmed") {
      await onFirstOrderPlaced(userId, orderId);
    } else if (status === "delivered") {
      await onOrderDelivered(orderId);
    } else if (status === "returned") {
      await onOrderReturned(orderId);
    }
  } catch (error) {
    console.error(
      `Referral status hook failed for order ${orderId} (${status}):`,
      error,
    );
  }

  if (status === "delivered") {
    try {
      await onOrderDeliveredForReview(orderId, userId);
    } catch (error) {
      console.error(`Review prompt hook failed for order ${orderId}:`, error);
    }
  }
}

/** The rider link for a dispatched order, for the ops share dialog. */
export async function getOrderDeliveryLink(orderId: string) {
  const link = await getDeliveryLinkForOrder(orderId);

  if (!link) {
    return {
      token: null,
      outcome: null,
      riderName: null,
      riderPhone: null,
      accessCode: null,
    };
  }

  // The code ops reads out belongs to the rider the link was issued to —
  // there is no per-link code, so without an assigned rider there is nothing
  // to share.
  const [assigned] = link.riderId
    ? await db
        .select({
          name: rider.name,
          phone: rider.phone,
          accessCode: rider.accessCode,
        })
        .from(rider)
        .where(eq(rider.id, link.riderId))
        .limit(1)
    : [];

  return {
    token: link.token,
    outcome: link.outcome,
    riderName: assigned?.name ?? null,
    riderPhone: assigned?.phone ?? null,
    accessCode: assigned?.accessCode ?? null,
  };
}

/**
 * Assign or reassign the rider on an already-dispatched order.
 *
 * Repairs orders that reached `out_for_delivery` before a rider was required,
 * and covers a legitimate hand-off mid-run. Minting is idempotent, so an
 * order that already has a live link keeps the same URL.
 */
export async function assignOrderRider(orderId: string, riderId: string) {
  const [row] = await db
    .select({ status: order.status })
    .from(order)
    .where(eq(order.id, orderId))
    .limit(1);

  if (!row) {
    throw notFound("Order");
  }
  if (row.status !== "out_for_delivery") {
    throw badRequest("Only a dispatched order can be assigned to a rider.");
  }

  await issueDeliveryLink(orderId, riderId);
  return getOrderDeliveryLink(orderId);
}
