import { db } from "@mumzo/db";
import { baby, customerEvent, wishlist } from "@mumzo/db/schema/account";
import { user } from "@mumzo/db/schema/auth";
import {
  hub,
  product,
  productColor,
  productSize,
} from "@mumzo/db/schema/catalog";
import {
  cart,
  cartItem,
  order,
  orderItem,
  payment,
} from "@mumzo/db/schema/commerce";
import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  lt,
  or,
  type SQL,
  sql,
} from "drizzle-orm";
import { toWholeRupees } from "@/lib/money";

/** Pure data access — no business rules. `users.service.ts` owns those. */

const selection = {
  id: user.id,
  name: user.name,
  email: user.email,
  phoneNumber: user.phoneNumber,
  createdAt: user.createdAt,
};

type SortBy = "joinedAt" | "name";

const SORT_COLUMNS = {
  joinedAt: user.createdAt,
  name: user.name,
} satisfies Record<SortBy, typeof user.createdAt | typeof user.name>;

export async function findPage(filters: {
  page: number;
  limit: number;
  search?: string;
  sortBy: SortBy;
  sortDir: "asc" | "desc";
}) {
  const conditions: SQL[] = [];

  if (filters.search) {
    const clause = or(
      ilike(user.name, `%${filters.search}%`),
      ilike(user.email, `%${filters.search}%`),
      ilike(user.phoneNumber, `%${filters.search}%`),
    );
    if (clause) {
      conditions.push(clause);
    }
  }

  const where = conditions.length > 0 ? conditions[0] : undefined;
  const orderFn = filters.sortDir === "asc" ? asc : desc;
  const orderColumn = SORT_COLUMNS[filters.sortBy];

  const [rows, countRows] = await Promise.all([
    db
      .select(selection)
      .from(user)
      .where(where)
      .orderBy(orderFn(orderColumn))
      .limit(filters.limit)
      .offset((filters.page - 1) * filters.limit),
    db
      .select({ total: count(user.id) })
      .from(user)
      .where(where),
  ]);

  return { rows, total: countRows[0]?.total ?? 0 };
}

/**
 * Signups per day within `[from, to)`, plus the total user count as of
 * `from` (so the caller can build a running total without a second
 * full-table scan). `to` is exclusive — pass the day *after* the last day
 * you want included.
 */
export async function signupsByDay(from: Date, to: Date) {
  const [rows, priorTotalRows] = await Promise.all([
    db
      .select({
        day: sql<string>`to_char(${user.createdAt}, 'YYYY-MM-DD')`,
        count: sql<number>`count(*)::int`,
      })
      .from(user)
      .where(and(gte(user.createdAt, from), lt(user.createdAt, to)))
      .groupBy(sql`to_char(${user.createdAt}, 'YYYY-MM-DD')`)
      .orderBy(sql`to_char(${user.createdAt}, 'YYYY-MM-DD')`),
    db
      .select({ total: count(user.id) })
      .from(user)
      .where(lt(user.createdAt, from)),
  ]);

  return {
    rows,
    priorTotal: priorTotalRows[0]?.total ?? 0,
  };
}

export async function findById(id: string) {
  const [row] = await db
    .select(selection)
    .from(user)
    .where(eq(user.id, id))
    .limit(1);
  return row;
}

/** Real order aggregates for the customer list/detail — orderCount,
 * lifetimeValue (paise, converted by the caller), and the most recent
 * placedAt, per user. */
export async function orderStatsByUserId(userIds: string[]) {
  type Stats = {
    orderCount: number;
    lifetimeValue: number;
    lastOrderAt: Date | null;
  };
  const byUser = new Map<string, Stats>();
  if (userIds.length === 0) return byUser;

  const rows = await db
    .select({
      userId: order.userId,
      orderCount: sql<number>`count(*)::int`,
      lifetimeValue: sql<number>`coalesce(sum(${order.total}), 0)::int`,
      // Raw `sql` fragments don't get the driver's timestamp parsing, so this
      // can come back as a string rather than a real `Date` — normalize it.
      lastOrderAt: sql<string | null>`max(${order.placedAt})`,
    })
    .from(order)
    .where(inArray(order.userId, userIds))
    .groupBy(order.userId);

  for (const row of rows) {
    byUser.set(row.userId, {
      orderCount: row.orderCount,
      lifetimeValue: row.lifetimeValue,
      lastOrderAt: row.lastOrderAt ? new Date(row.lastOrderAt) : null,
    });
  }

  return byUser;
}

export async function ordersByUserId(
  userId: string,
  filters: { page: number; limit: number },
) {
  const offset = (filters.page - 1) * filters.limit;
  const where = eq(order.userId, userId);

  const [rows, [countRow]] = await Promise.all([
    db
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
      .offset(offset),
    db.select({ count: sql<number>`count(*)::int` }).from(order).where(where),
  ]);

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
    rows: rows.map((row) => ({
      id: row.id,
      status: row.status,
      customerName: row.addressName,
      hubName: row.hubName,
      itemCount: itemCounts.get(row.id) ?? 0,
      total: toWholeRupees(row.total),
      paymentMethod: row.paymentMethod ?? "cod",
      placedAt: row.placedAt.toISOString(),
    })),
    total: countRow?.count ?? 0,
  };
}

/** One active cart per user — live pricing off product/variant rows, same
 * as the customer-facing cart (see `commerce.ts`'s cart comment). */
export async function cartByUserId(userId: string) {
  const [cartRow] = await db
    .select({ id: cart.id, updatedAt: cart.updatedAt })
    .from(cart)
    .where(eq(cart.userId, userId))
    .limit(1);

  if (!cartRow) return { items: [], updatedAt: null };

  const rows = await db
    .select({
      productId: product.id,
      name: product.name,
      productPrice: product.price,
      size: productSize,
      color: productColor,
      qty: cartItem.qty,
    })
    .from(cartItem)
    .innerJoin(product, eq(cartItem.productId, product.id))
    .leftJoin(productSize, eq(cartItem.productSizeId, productSize.id))
    .leftJoin(productColor, eq(cartItem.productColorId, productColor.id))
    .where(eq(cartItem.cartId, cartRow.id));

  return {
    items: rows.map((row) => ({
      productId: row.productId,
      name: row.name,
      variantLabel: row.size?.label ?? row.color?.label ?? null,
      price: toWholeRupees(
        row.size?.price ?? row.color?.price ?? row.productPrice,
      ),
      qty: row.qty,
    })),
    updatedAt: cartRow.updatedAt.toISOString(),
  };
}

export async function wishlistByUserId(
  userId: string,
  filters: { page: number; limit: number },
) {
  const offset = (filters.page - 1) * filters.limit;
  const where = eq(wishlist.userId, userId);

  const [rows, [countRow]] = await Promise.all([
    db
      .select({
        productId: product.id,
        name: product.name,
        price: product.price,
        addedAt: wishlist.createdAt,
      })
      .from(wishlist)
      .innerJoin(product, eq(wishlist.productId, product.id))
      .where(where)
      .orderBy(desc(wishlist.createdAt))
      .limit(filters.limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(wishlist)
      .where(where),
  ]);

  return {
    rows: rows.map((row) => ({
      productId: row.productId,
      name: row.name,
      price: toWholeRupees(row.price),
      addedAt: row.addedAt.toISOString(),
    })),
    total: countRow?.count ?? 0,
  };
}

export async function activityByUserId(
  userId: string,
  filters: { page: number; limit: number },
) {
  const offset = (filters.page - 1) * filters.limit;
  const where = eq(customerEvent.userId, userId);

  const [rows, [countRow]] = await Promise.all([
    db
      .select({
        id: customerEvent.id,
        action: customerEvent.action,
        entityType: customerEvent.entityType,
        entityId: customerEvent.entityId,
        metadata: customerEvent.metadata,
        createdAt: customerEvent.createdAt,
      })
      .from(customerEvent)
      .where(where)
      .orderBy(desc(customerEvent.createdAt))
      .limit(filters.limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(customerEvent)
      .where(where),
  ]);

  return {
    rows: rows.map((row) => ({
      ...row,
      createdAt: row.createdAt.toISOString(),
    })),
    total: countRow?.count ?? 0,
  };
}

export async function babiesByUserId(userIds: string[]) {
  if (userIds.length === 0) {
    return new Map<string, { name: string; dob: string }[]>();
  }

  const rows = await db
    .select({ userId: baby.userId, name: baby.name, dob: baby.dob })
    .from(baby)
    .where(inArray(baby.userId, userIds));

  const byUser = new Map<string, { name: string; dob: string }[]>();

  for (const row of rows) {
    const list = byUser.get(row.userId) ?? [];
    list.push({ name: row.name, dob: row.dob });
    byUser.set(row.userId, list);
  }

  return byUser;
}
