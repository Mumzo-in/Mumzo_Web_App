import { db } from "@mumzo/db";
import { baby } from "@mumzo/db/schema/account";
import { user } from "@mumzo/db/schema/auth";
import { category, hub, inventory, product } from "@mumzo/db/schema/catalog";
import { order, orderItem, payment, refund } from "@mumzo/db/schema/commerce";

import {
  and,
  desc,
  eq,
  gte,
  inArray,
  lt,
  lte,
  notInArray,
  sql,
} from "drizzle-orm";

import { toWholeRupees } from "@/lib/money";
import type {
  AttentionCounts,
  CategorySalesPoint,
  OrderAnalytics,
  OrderDashboard,
  RecentUser,
  RevenueTrendPoint,
  UserCounts,
} from "./schema";

const DAY_MS = 24 * 60 * 60 * 1000;
const RECENT_USERS_LIMIT = 5;
const RECENT_ORDERS_LIMIT = 5;
const TREND_DAYS = 7;
/** Orders that never completed (or were reversed) shouldn't count as GMV. */
const GMV_EXCLUDED_STATUSES = ["pending_payment", "cancelled"];

async function countUsers(from?: Date, to?: Date) {
  const conditions = [
    from ? gte(user.createdAt, from) : undefined,
    to ? lt(user.createdAt, to) : undefined,
  ].filter((c): c is NonNullable<typeof c> => c !== undefined);

  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(user)
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  return row?.count ?? 0;
}

/**
 * Total customers and new signups in the trailing 24h, compared against the
 * 24h before that so the panel can show a change percentage.
 */
export async function userCounts(): Promise<UserCounts> {
  const now = new Date();
  const dayAgo = new Date(now.getTime() - DAY_MS);
  const twoDaysAgo = new Date(now.getTime() - 2 * DAY_MS);

  const [total, newLastDay, newPriorDay] = await Promise.all([
    countUsers(),
    countUsers(dayAgo),
    countUsers(twoDaysAgo, dayAgo),
  ]);

  const changePct =
    newPriorDay === 0
      ? newLastDay > 0
        ? 100
        : 0
      : ((newLastDay - newPriorDay) / newPriorDay) * 100;

  return {
    totalUsers: total,
    newUsers: newLastDay,
    newUsersChangePct: Math.round(changePct * 10) / 10,
  };
}

function babyAge(dob: string): string {
  const months =
    (Date.now() - new Date(dob).getTime()) / (1000 * 60 * 60 * 24 * 30.44);

  if (months < 1) {
    return "Newborn";
  }

  const rounded = Math.round(months);
  return `${rounded} ${rounded === 1 ? "month" : "months"}`;
}

/**
 * Most recently registered customers, with their first baby if one was
 * captured at onboarding. `orderCount` is not sourced yet — orders aren't
 * wired to real data — so it's always 0 rather than fabricated.
 *
 * Users are fetched first and babies joined after, rather than joined in one
 * query — a user with more than one baby would otherwise multiply rows and
 * break the 5-row limit.
 */
export async function recentUsers(): Promise<RecentUser[]> {
  const users = await db
    .select({
      id: user.id,
      name: user.name,
      phoneNumber: user.phoneNumber,
      createdAt: user.createdAt,
    })
    .from(user)
    .orderBy(desc(user.createdAt))
    .limit(RECENT_USERS_LIMIT);

  if (users.length === 0) {
    return [];
  }

  const babies = await db
    .select({ userId: baby.userId, name: baby.name, dob: baby.dob })
    .from(baby)
    .where(
      inArray(
        baby.userId,
        users.map((u) => u.id),
      ),
    );

  const babyByUserId = new Map(babies.map((b) => [b.userId, b]));

  return users.map((row) => {
    const userBaby = babyByUserId.get(row.id);

    return {
      id: row.id,
      name: row.name,
      phoneNumber: row.phoneNumber,
      babyName: userBaby?.name ?? null,
      babyAge: userBaby ? babyAge(userBaby.dob) : null,
      joinedAt: row.createdAt.toISOString(),
      orderCount: 0,
    };
  });
}

function pctChange(current: number, previous: number): number {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

async function gmvAndCount(from: Date, to: Date) {
  const [row] = await db
    .select({
      gmv: sql<number>`coalesce(sum(${order.total}), 0)::int`,
      count: sql<number>`count(*)::int`,
    })
    .from(order)
    .where(
      and(
        gte(order.placedAt, from),
        lt(order.placedAt, to),
        notInArray(order.status, GMV_EXCLUDED_STATUSES),
      ),
    );

  return { gmv: row?.gmv ?? 0, count: row?.count ?? 0 };
}

/** GMV/order-count/AOV for the trailing 24h vs the 24h before that. */
async function orderMetrics() {
  const now = new Date();
  const dayAgo = new Date(now.getTime() - DAY_MS);
  const twoDaysAgo = new Date(now.getTime() - 2 * DAY_MS);

  const [today, yesterday] = await Promise.all([
    gmvAndCount(dayAgo, now),
    gmvAndCount(twoDaysAgo, dayAgo),
  ]);

  const aov = today.count > 0 ? Math.round(today.gmv / today.count) : 0;
  const prevAov =
    yesterday.count > 0 ? Math.round(yesterday.gmv / yesterday.count) : 0;

  return {
    gmv: toWholeRupees(today.gmv),
    gmvChangePct: pctChange(today.gmv, yesterday.gmv),
    orders: today.count,
    ordersChangePct: pctChange(today.count, yesterday.count),
    aov: toWholeRupees(aov),
    aovChangePct: pctChange(aov, prevAov),
  };
}

/**
 * Daily GMV + order count for each of the trailing `TREND_DAYS` days,
 * inclusive of today. `from` is backdated one extra day so the day-bucket
 * loop below (which starts at `from` and steps forward) lands its last
 * bucket on today, not yesterday.
 */
async function revenueTrend(): Promise<RevenueTrendPoint[]> {
  const from = new Date(Date.now() - (TREND_DAYS - 1) * DAY_MS);

  const rows = await db
    .select({
      day: sql<string>`to_char(${order.placedAt}, 'YYYY-MM-DD')`,
      revenue: sql<number>`coalesce(sum(${order.total}), 0)::int`,
      count: sql<number>`count(*)::int`,
    })
    .from(order)
    .where(
      and(
        gte(order.placedAt, sql`date_trunc('day', ${from}::timestamp)`),
        notInArray(order.status, GMV_EXCLUDED_STATUSES),
      ),
    )
    .groupBy(sql`to_char(${order.placedAt}, 'YYYY-MM-DD')`)
    .orderBy(sql`to_char(${order.placedAt}, 'YYYY-MM-DD')`);

  const byDay = new Map(rows.map((r) => [r.day, r]));

  return Array.from({ length: TREND_DAYS }, (_, i) => {
    const date = new Date(from.getTime() + i * DAY_MS);
    const key = date.toISOString().slice(0, 10);
    const row = byDay.get(key);
    return {
      date: key,
      revenue: toWholeRupees(row?.revenue ?? 0),
      orders: row?.count ?? 0,
    };
  });
}

async function recentOrders() {
  const rows = await db
    .select({
      id: order.id,
      status: order.status,
      addressName: order.addressName,
      total: order.total,
      placedAt: order.placedAt,
    })
    .from(order)
    .orderBy(desc(order.placedAt))
    .limit(RECENT_ORDERS_LIMIT);

  if (rows.length === 0) {
    return [];
  }

  const orderIds = rows.map((r) => r.id);
  const counts = await db
    .select({
      orderId: orderItem.orderId,
      count: sql<number>`count(*)::int`,
    })
    .from(orderItem)
    .where(inArray(orderItem.orderId, orderIds))
    .groupBy(orderItem.orderId);
  const itemCounts = new Map(counts.map((c) => [c.orderId, c.count]));

  return rows.map((row) => ({
    id: row.id,
    customerName: row.addressName,
    itemCount: itemCounts.get(row.id) ?? 0,
    total: toWholeRupees(row.total),
    status: row.status,
    placedAt: row.placedAt.toISOString(),
  }));
}

export async function orderDashboard(): Promise<OrderDashboard> {
  const [metrics, trend, recent] = await Promise.all([
    orderMetrics(),
    revenueTrend(),
    recentOrders(),
  ]);

  return {
    metrics,
    revenueTrend: trend,
    recentOrders: recent,
  };
}

/** `to` is treated as inclusive of the whole day, matching how the admin
 * date-range picker's presets are built (`from`/`to` are both `YYYY-MM-DD`). */
function parseRangeBounds(from: string, to: string) {
  return {
    fromDate: new Date(`${from}T00:00:00.000Z`),
    toDate: new Date(`${to}T23:59:59.999Z`),
  };
}

async function rangeRevenueTrend(
  fromDate: Date,
  toDate: Date,
): Promise<RevenueTrendPoint[]> {
  const rows = await db
    .select({
      day: sql<string>`to_char(${order.placedAt}, 'YYYY-MM-DD')`,
      revenue: sql<number>`coalesce(sum(${order.total}), 0)::int`,
      count: sql<number>`count(*)::int`,
    })
    .from(order)
    .where(
      and(
        gte(order.placedAt, fromDate),
        lt(order.placedAt, toDate),
        notInArray(order.status, GMV_EXCLUDED_STATUSES),
      ),
    )
    .groupBy(sql`to_char(${order.placedAt}, 'YYYY-MM-DD')`)
    .orderBy(sql`to_char(${order.placedAt}, 'YYYY-MM-DD')`);

  return rows.map((row) => ({
    date: row.day,
    revenue: toWholeRupees(row.revenue),
    orders: row.count,
  }));
}

async function rangeOrderStatus(fromDate: Date, toDate: Date) {
  const rows = await db
    .select({ status: order.status, count: sql<number>`count(*)::int` })
    .from(order)
    .where(and(gte(order.placedAt, fromDate), lt(order.placedAt, toDate)))
    .groupBy(order.status);

  return rows.map((row) => ({ status: row.status, count: row.count }));
}

async function rangeHubRevenue(fromDate: Date, toDate: Date) {
  const rows = await db
    .select({
      hubId: hub.id,
      hubName: hub.name,
      revenue: sql<number>`coalesce(sum(${order.total}), 0)::int`,
      count: sql<number>`count(*)::int`,
    })
    .from(order)
    .innerJoin(hub, eq(order.hubId, hub.id))
    .where(
      and(
        gte(order.placedAt, fromDate),
        lt(order.placedAt, toDate),
        notInArray(order.status, GMV_EXCLUDED_STATUSES),
      ),
    )
    .groupBy(hub.id, hub.name);

  return rows.map((row) => ({
    hubId: row.hubId,
    hubName: row.hubName,
    revenue: toWholeRupees(row.revenue),
    orders: row.count,
  }));
}

async function rangePaymentMethod(fromDate: Date, toDate: Date) {
  const rows = await db
    .select({
      method: payment.method,
      count: sql<number>`count(*)::int`,
    })
    .from(payment)
    .innerJoin(order, eq(payment.orderId, order.id))
    .where(and(gte(order.placedAt, fromDate), lt(order.placedAt, toDate)))
    .groupBy(payment.method);

  return rows.map((row) => ({ method: row.method, count: row.count }));
}

export async function orderAnalytics(
  from: string,
  to: string,
): Promise<OrderAnalytics> {
  const { fromDate, toDate } = parseRangeBounds(from, to);

  const [trend, orderStatus, hubRevenue, paymentMethod] = await Promise.all([
    rangeRevenueTrend(fromDate, toDate),
    rangeOrderStatus(fromDate, toDate),
    rangeHubRevenue(fromDate, toDate),
    rangePaymentMethod(fromDate, toDate),
  ]);

  const totalRevenue = trend.reduce((sum, point) => sum + point.revenue, 0);
  const totalOrders = trend.reduce((sum, point) => sum + point.orders, 0);
  const aov = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

  return {
    totalRevenue,
    totalOrders,
    aov,
    revenueTrend: trend,
    orderStatus,
    hubRevenue,
    paymentMethod,
  };
}

/** Backs the dashboard's "Needs attention" bar — real counts, not mock. */
export async function attentionCounts(): Promise<AttentionCounts> {
  const [[lowStockRow], [pendingRefundRow]] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(inventory)
      .where(lte(inventory.stock, inventory.reorderPoint)),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(refund)
      .where(eq(refund.status, "pending")),
  ]);

  return {
    lowStockCount: lowStockRow?.count ?? 0,
    pendingRefunds: pendingRefundRow?.count ?? 0,
  };
}

/** GMV contribution by category, over all-time orders (excludes cancelled/unpaid). */
export async function categorySales(): Promise<CategorySalesPoint[]> {
  const rows = await db
    .select({
      name: category.name,
      value: sql<number>`coalesce(sum(${orderItem.priceSnapshot} * ${orderItem.qty}), 0)::int`,
    })
    .from(orderItem)
    .innerJoin(order, eq(orderItem.orderId, order.id))
    .innerJoin(product, eq(orderItem.productId, product.id))
    .innerJoin(category, eq(product.categoryId, category.id))
    .where(notInArray(order.status, GMV_EXCLUDED_STATUSES))
    .groupBy(category.id, category.name)
    .orderBy(desc(sql`sum(${orderItem.priceSnapshot} * ${orderItem.qty})`));

  return rows.map((row) => ({
    name: row.name,
    value: toWholeRupees(row.value),
  }));
}
