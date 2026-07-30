import { db } from "@mumzo/db";
import { user } from "@mumzo/db/schema/auth";
import { hub } from "@mumzo/db/schema/catalog";
import {
  order,
  orderItem,
  orderStatusLog,
  payment,
} from "@mumzo/db/schema/commerce";
import { and, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";

import { badRequest, notFound } from "@/core/errors";
import { toWholeRupees } from "@/lib/money";

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
 * Terminal states (delivered/cancelled/returned) have no further moves. */
const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  pending_payment: ["confirmed", "cancelled"],
  confirmed: ["packed", "cancelled"],
  packed: ["shipped", "cancelled"],
  shipped: ["out_for_delivery"],
  out_for_delivery: ["delivered"],
  delivered: ["return_requested"],
  return_requested: ["returned", "delivered"],
  returned: [],
  cancelled: [],
};

export async function updateOrderStatus(
  orderId: string,
  input: { status: string; note?: string },
  actor: string,
) {
  const [row] = await db
    .select({ id: order.id, status: order.status })
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
  });

  return getOrder(orderId);
}
