import { db } from "@mumzo/db";
import { baby, customerEvent, wishlist } from "@mumzo/db/schema/account";
import { session, user } from "@mumzo/db/schema/auth";
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
  notInArray,
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

/** Orders that never completed (or were reversed) shouldn't count as GMV —
 * mirrors `dashboard/service.ts`'s `GMV_EXCLUDED_STATUSES`. */
const GMV_EXCLUDED_STATUSES = ["pending_payment", "cancelled"];

/**
 * Every metric below is one aggregate query — never a per-user loop — so a
 * range card costs the same handful of index scans regardless of how many
 * customers exist. `order_userId_idx`/`session_userId_idx` back the
 * `distinct`/`group by` here; `order.placedAt`/`session.updatedAt` aren't
 * separately indexed yet, but a plain range filter over `order`/`session`
 * is still cheap at the row counts a single-city launch produces — revisit
 * with a `placedAt` index if this table grows into the millions.
 */

export async function totalUserCount() {
  const [row] = await db.select({ count: count(user.id) }).from(user);
  return row?.count ?? 0;
}

export async function activeOrderedCount(from: Date, to: Date) {
  const [row] = await db
    .select({ count: sql<number>`count(distinct ${order.userId})::int` })
    .from(order)
    .where(and(gte(order.placedAt, from), lt(order.placedAt, to)));
  return row?.count ?? 0;
}

export async function activeSessionCount(from: Date, to: Date) {
  const [row] = await db
    .select({ count: sql<number>`count(distinct ${session.userId})::int` })
    .from(session)
    .where(and(gte(session.updatedAt, from), lt(session.updatedAt, to)));
  return row?.count ?? 0;
}

/** Repeat-purchase rate and GMV both need "orders per user in range" — one
 * grouped subquery serves both instead of two separate scans. */
export async function orderStatsInRange(from: Date, to: Date) {
  const perUser = db
    .select({
      userId: order.userId,
      orderCount: sql<number>`count(*)::int`.as("order_count"),
      userTotal: sql<number>`coalesce(sum(${order.total}), 0)::int`.as(
        "user_total",
      ),
    })
    .from(order)
    .where(
      and(
        gte(order.placedAt, from),
        lt(order.placedAt, to),
        notInArray(order.status, GMV_EXCLUDED_STATUSES),
      ),
    )
    .groupBy(order.userId)
    .as("per_user");

  const [row] = await db
    .select({
      activeUsers: sql<number>`count(*)::int`,
      repeatUsers: sql<number>`count(*) filter (where ${perUser.orderCount} >= 2)::int`,
      gmv: sql<number>`coalesce(sum(${perUser.userTotal}), 0)::int`,
    })
    .from(perUser);

  return {
    activeUsers: row?.activeUsers ?? 0,
    repeatUsers: row?.repeatUsers ?? 0,
    gmv: row?.gmv ?? 0,
  };
}

/** All-time, not range-scoped — the average of each customer's lifetime
 * order total, across customers who have placed at least one order. */
export async function avgLifetimeValue() {
  const perUser = db
    .select({
      userId: order.userId,
      userTotal: sql<number>`coalesce(sum(${order.total}), 0)::int`.as(
        "user_total",
      ),
    })
    .from(order)
    .where(notInArray(order.status, GMV_EXCLUDED_STATUSES))
    .groupBy(order.userId)
    .as("per_user");

  const [row] = await db
    .select({ avg: sql<number>`coalesce(avg(${perUser.userTotal}), 0)::int` })
    .from(perUser);

  return row?.avg ?? 0;
}

/**
 * Cohort retention: of everyone who signed up in month M, what % placed at
 * least one order by month M+offset, for offset 0..6. One query — a cohort
 * table (signup month + size) cross-joined against a 0..6 offset series,
 * each cell an `exists` against `order` — rather than seven separate
 * per-offset scans.
 */
export async function orderRetentionCohort() {
  const rows = await db.execute<{ month: number; retention_pct: number }>(sql`
    with cohorts as (
      select
        date_trunc('month', ${user.createdAt}) as cohort_month,
        ${user.id} as user_id
      from ${user}
      where ${user.createdAt} >= date_trunc('month', now()) - interval '6 months'
    ),
    cohort_sizes as (
      select cohort_month, count(*)::int as size
      from cohorts
      group by cohort_month
    ),
    offsets as (
      select generate_series(0, 6) as month_offset
    ),
    retained as (
      select
        c.cohort_month,
        o.month_offset,
        count(distinct c.user_id) filter (
          where exists (
            select 1 from ${order} ord
            where ord.user_id = c.user_id
              and ord.placed_at >= c.cohort_month + (o.month_offset || ' months')::interval
              and ord.placed_at < c.cohort_month + ((o.month_offset + 1) || ' months')::interval
          )
        )::int as retained_count
      from cohorts c
      cross join offsets o
      where c.cohort_month + (o.month_offset || ' months')::interval <= now()
      group by c.cohort_month, o.month_offset
    )
    select
      r.month_offset as month,
      case when sum(cs.size) = 0 then 0
        else round(100.0 * sum(r.retained_count) / sum(cs.size), 1)
      end as retention_pct
    from retained r
    join cohort_sizes cs on cs.cohort_month = r.cohort_month
    group by r.month_offset
    order by r.month_offset
  `);

  return rows.rows.map((row) => ({
    month: Number(row.month),
    retentionPct: Number(row.retention_pct),
  }));
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
