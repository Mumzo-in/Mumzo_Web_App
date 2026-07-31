import { db } from "@mumzo/db";
import { address } from "@mumzo/db/schema/account";
import {
  brand,
  inventory,
  product,
  productColor,
  productSize,
} from "@mumzo/db/schema/catalog";
import {
  cart,
  cartItem,
  order,
  orderItem,
  orderStatusLog,
  payment,
} from "@mumzo/db/schema/commerce";
import { coupon } from "@mumzo/db/schema/marketing";
import { notify } from "@mumzo/notifications";
import { ROOMS, realtime } from "@mumzo/realtime";
import { and, desc, eq, inArray, sql } from "drizzle-orm";

import { badRequest, notFound } from "@/core/errors";
import { toWholeRupees } from "@/lib/money";
import { validateCoupon } from "@/modules/admin/v1/coupons/coupons.service";
import {
  computeCartTotals,
  resolveHubForPincode,
  resolveLine,
} from "@/shared/pricing";

async function requireCartRow(userId: string) {
  const [row] = await db
    .select()
    .from(cart)
    .where(eq(cart.userId, userId))
    .limit(1);
  if (!row) {
    throw badRequest("Your cart is empty.");
  }
  return row;
}

/** Same join shape as the cart service's `loadLines` — line items always
 * resolve price/gst/hsn/weight from the variant when one exists, else the
 * parent product (see `shared/pricing.ts`). Kept local rather than shared
 * because the cart's version also computes `isOutOfStock`/display fields
 * the order path doesn't need; the snapshot fields below are what matter
 * for placing an order.
 *
 * Stock is the active hub's `inventory.stock`, matched on the same variant
 * as the cart line (or the variant-less row when there's no size/color) —
 * the same number the admin Inventory panel edits. Not `productSize`/
 * `productColor.stock`, which is only ever set once at product creation and
 * never updated after. */
async function loadCartLinesForOrder(cartId: string, hubId: string) {
  const rows = await db
    .select({
      item: cartItem,
      product,
      brandName: brand.name,
      size: productSize,
      color: productColor,
      stock: inventory.stock,
    })
    .from(cartItem)
    .innerJoin(product, eq(cartItem.productId, product.id))
    .innerJoin(brand, eq(product.brandId, brand.id))
    .leftJoin(productSize, eq(cartItem.productSizeId, productSize.id))
    .leftJoin(productColor, eq(cartItem.productColorId, productColor.id))
    .leftJoin(
      inventory,
      and(
        eq(inventory.productId, product.id),
        eq(inventory.hubId, hubId),
        sql`${inventory.productSizeId} is not distinct from ${cartItem.productSizeId}`,
        sql`${inventory.productColorId} is not distinct from ${cartItem.productColorId}`,
      ),
    )
    .where(eq(cartItem.cartId, cartId));

  return rows.map(({ item, product: p, size, color, stock }) => {
    const resolved = resolveLine(p, size, color);
    return {
      cartItemId: item.id,
      productId: p.id,
      productSizeId: item.productSizeId,
      productColorId: item.productColorId,
      variantLabel: size?.label ?? color?.label ?? null,
      nameSnapshot: p.name,
      qty: item.qty,
      stock: stock ?? 0,
      ...resolved,
    };
  });
}

async function requireOwnedAddress(userId: string, addressId: string) {
  const [row] = await db
    .select()
    .from(address)
    .where(and(eq(address.id, addressId), eq(address.userId, userId)))
    .limit(1);
  if (!row) {
    throw notFound("Address");
  }
  return row;
}

function toPublicOrderItem(row: {
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

export async function placeOrder(
  userId: string,
  input: { addressId: string; idempotencyKey: string },
) {
  const [existing] = await db
    .select({ id: order.id })
    .from(order)
    .where(eq(order.idempotencyKey, input.idempotencyKey))
    .limit(1);
  if (existing) {
    return getOrder(userId, existing.id);
  }

  const cartRow = await requireCartRow(userId);
  const addressRow = await requireOwnedAddress(userId, input.addressId);
  const hubRow = await resolveHubForPincode(addressRow.pincode);
  const lines = await loadCartLinesForOrder(cartRow.id, hubRow.id);
  if (lines.length === 0) {
    throw badRequest("Your cart is empty.");
  }

  const outOfStock = lines.filter((l) => l.qty > l.stock);
  if (outOfStock.length > 0) {
    throw badRequest(
      `Out of stock: ${outOfStock.map((l) => l.nameSnapshot).join(", ")}.`,
    );
  }

  let couponId: string | null = null;
  let discount = 0;
  if (cartRow.couponId) {
    const couponRow = await db.query.coupon.findFirst({
      where: (c, { eq: eqOp }) => eqOp(c.id, cartRow.couponId as string),
    });
    if (couponRow) {
      const subtotal = lines.reduce((sum, l) => sum + l.price * l.qty, 0);
      try {
        const result = await validateCoupon({
          code: couponRow.code,
          cartTotal: subtotal,
          productIds: lines.map((l) => l.productId),
          userId,
        });
        couponId = couponRow.id;
        discount = result.discount;
      } catch {
        // Coupon stopped applying between cart and checkout — place the
        // order without it rather than block placement (§8 edge case).
      }
    }
  }

  const totals = computeCartTotals(lines, discount);

  const orderId = await db.transaction(async (tx) => {
    const [orderRow] = await tx
      .insert(order)
      .values({
        userId,
        hubId: hubRow.id,
        couponId,
        status: "confirmed", // COD only for now — no payment gateway step.
        addressLabel: addressRow.label,
        addressName: addressRow.name,
        addressPhone: addressRow.phone,
        addressLine1: addressRow.line1,
        addressLine2: addressRow.line2,
        addressLandmark: addressRow.landmark,
        addressPincode: addressRow.pincode,
        addressCity: addressRow.city,
        subtotal: totals.subtotal,
        gstAmount: totals.gstAmount,
        deliveryFee: totals.deliveryFee,
        discount: totals.discount,
        total: totals.total,
        idempotencyKey: input.idempotencyKey,
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
        toStatus: "pending_payment",
        actor: "system",
        note: "Order placed (COD).",
      },
      {
        orderId: orderRow.id,
        fromStatus: "pending_payment",
        toStatus: "confirmed",
        actor: "system",
        note: "COD orders confirm immediately — no payment gateway step.",
      },
    ]);

    await tx.insert(payment).values({
      orderId: orderRow.id,
      provider: "cod",
      status: "cod_pending",
      amount: totals.total,
      method: "cod",
    });

    if (couponId) {
      await tx
        .update(coupon)
        .set({ usedCount: sql`${coupon.usedCount} + 1` })
        .where(eq(coupon.id, couponId));
    }

    await tx.delete(cartItem).where(eq(cartItem.cartId, cartRow.id));
    await tx
      .update(cart)
      .set({ couponId: null })
      .where(eq(cart.id, cartRow.id));

    return orderRow.id;
  });

  // Best-effort — neither call must fail an order that already committed.
  // realtime.publish() is the live in-app feed for staff with the dashboard
  // open; notify.sendToAllStaff() is the OS-level push for when it isn't
  // focused. See docs/infra/realtime-architecture.md for how they relate.
  realtime
    .publish(ROOMS.adminOrders, "order.created", {
      orderId,
      hubId: hubRow.id,
      total: totals.total,
      addressName: addressRow.name,
    })
    .catch((error) => {
      console.error(`Failed to publish order.created for ${orderId}:`, error);
    });

  notify
    .sendToAllStaff("order.created", {
      orderId,
      total: totals.total,
      addressName: addressRow.name,
    })
    .catch((error) => {
      console.error(
        `Failed to enqueue staff notification for order ${orderId}:`,
        error,
      );
    });

  return getOrder(userId, orderId);
}

export async function listOrders(
  userId: string,
  filters: { page: number; limit: number },
) {
  const offset = (filters.page - 1) * filters.limit;

  const rows = await db
    .select({
      id: order.id,
      status: order.status,
      subtotal: order.subtotal,
      total: order.total,
      placedAt: order.placedAt,
    })
    .from(order)
    .where(eq(order.userId, userId))
    .orderBy(desc(order.placedAt))
    .limit(filters.limit)
    .offset(offset);

  const [countRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(order)
    .where(eq(order.userId, userId));
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
      itemCount: itemCounts.get(row.id) ?? 0,
      subtotal: toWholeRupees(row.subtotal),
      total: toWholeRupees(row.total),
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

export async function getOrder(userId: string, orderId: string) {
  const [row] = await db
    .select()
    .from(order)
    .where(and(eq(order.id, orderId), eq(order.userId, userId)))
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
    id: row.id,
    status: row.status,
    addressLabel: row.addressLabel,
    addressName: row.addressName,
    addressPhone: row.addressPhone,
    addressLine1: row.addressLine1,
    addressLine2: row.addressLine2,
    addressLandmark: row.addressLandmark,
    addressPincode: row.addressPincode,
    addressCity: row.addressCity,
    subtotal: toWholeRupees(row.subtotal),
    gstAmount: toWholeRupees(row.gstAmount),
    deliveryFee: toWholeRupees(row.deliveryFee),
    discount: toWholeRupees(row.discount),
    total: toWholeRupees(row.total),
    items: items.map(toPublicOrderItem),
    statusLog: statusLog.map((log) => ({
      id: log.id,
      fromStatus: log.fromStatus,
      toStatus: log.toStatus,
      actor: log.actor,
      note: log.note,
      createdAt: log.createdAt.toISOString(),
    })),
    placedAt: row.placedAt.toISOString(),
  };
}

/** Cancellable only pre-pack, per docs/order-checkout-flow.md §8. */
const CANCELLABLE_STATUSES = new Set(["pending_payment", "confirmed"]);

export async function cancelOrder(
  userId: string,
  orderId: string,
  reason?: string,
) {
  const [row] = await db
    .select({ id: order.id, status: order.status })
    .from(order)
    .where(and(eq(order.id, orderId), eq(order.userId, userId)))
    .limit(1);
  if (!row) {
    throw notFound("Order");
  }
  if (!CANCELLABLE_STATUSES.has(row.status)) {
    throw badRequest(
      "This order can no longer be cancelled — contact support.",
    );
  }

  await db.transaction(async (tx) => {
    await tx
      .update(order)
      .set({ status: "cancelled" })
      .where(eq(order.id, orderId));
    await tx.insert(orderStatusLog).values({
      orderId,
      fromStatus: row.status,
      toStatus: "cancelled",
      actor: "customer",
      note: reason ?? null,
    });
  });

  return getOrder(userId, orderId);
}
