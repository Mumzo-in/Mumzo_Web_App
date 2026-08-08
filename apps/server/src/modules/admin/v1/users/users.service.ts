import { notFound } from "@/core/errors";
import { toWholeRupees } from "@/lib/money";
import * as usersRepo from "./users.repo";

type UserRow = NonNullable<Awaited<ReturnType<typeof usersRepo.findById>>>;
type OrderStats = {
  orderCount: number;
  lifetimeValue: number;
  lastOrderAt: Date | null;
};

/**
 * `status` is always "active" — the customer `user` table has no ban/status
 * column yet (unlike `staffUser`, which gets one from the admin plugin).
 */
function serialize(
  row: UserRow,
  babies: { name: string; dob: string }[],
  stats: OrderStats,
) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phoneNumber,
    status: "active" as const,
    orderCount: stats.orderCount,
    lifetimeValue: toWholeRupees(stats.lifetimeValue),
    babies,
    joinedAt: row.createdAt.toISOString(),
    lastOrderAt: stats.lastOrderAt ? stats.lastOrderAt.toISOString() : null,
  };
}

const EMPTY_STATS: OrderStats = {
  orderCount: 0,
  lifetimeValue: 0,
  lastOrderAt: null,
};

export async function listUsers(filters: {
  page: number;
  limit: number;
  search?: string;
  sortBy: "joinedAt" | "name";
  sortDir: "asc" | "desc";
}) {
  const { rows, total } = await usersRepo.findPage(filters);
  const userIds = rows.map((r) => r.id);
  const [babiesByUser, statsByUser] = await Promise.all([
    usersRepo.babiesByUserId(userIds),
    usersRepo.orderStatsByUserId(userIds),
  ]);

  return {
    data: rows.map((row) =>
      serialize(
        row,
        babiesByUser.get(row.id) ?? [],
        statsByUser.get(row.id) ?? EMPTY_STATS,
      ),
    ),
    meta: {
      page: filters.page,
      limit: filters.limit,
      total,
      hasNext: filters.page * filters.limit < total,
    },
  };
}

export async function getUser(id: string) {
  const row = await usersRepo.findById(id);
  if (!row) {
    throw notFound("Customer");
  }

  const [babiesByUser, statsByUser] = await Promise.all([
    usersRepo.babiesByUserId([id]),
    usersRepo.orderStatsByUserId([id]),
  ]);
  return serialize(
    row,
    babiesByUser.get(id) ?? [],
    statsByUser.get(id) ?? EMPTY_STATS,
  );
}

async function requireUser(id: string) {
  const row = await usersRepo.findById(id);
  if (!row) {
    throw notFound("Customer");
  }
  return row;
}

export async function listUserOrders(
  id: string,
  filters: { page: number; limit: number },
) {
  await requireUser(id);
  const { rows, total } = await usersRepo.ordersByUserId(id, filters);
  return {
    data: rows,
    meta: {
      page: filters.page,
      limit: filters.limit,
      total,
      hasNext: filters.page * filters.limit < total,
    },
  };
}

export async function getUserCart(id: string) {
  await requireUser(id);
  return usersRepo.cartByUserId(id);
}

export async function listUserWishlist(
  id: string,
  filters: { page: number; limit: number },
) {
  await requireUser(id);
  const { rows, total } = await usersRepo.wishlistByUserId(id, filters);
  return {
    data: rows,
    meta: {
      page: filters.page,
      limit: filters.limit,
      total,
      hasNext: filters.page * filters.limit < total,
    },
  };
}

export async function listUserActivity(
  id: string,
  filters: { page: number; limit: number },
) {
  await requireUser(id);
  const { rows, total } = await usersRepo.activityByUserId(id, filters);
  return {
    data: rows,
    meta: {
      page: filters.page,
      limit: filters.limit,
      total,
      hasNext: filters.page * filters.limit < total,
    },
  };
}

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Daily signups within `[from, to]` (inclusive, calendar days), with a
 * running cumulative total. Days with zero signups are filled in explicitly
 * — the repo only returns rows for days that had at least one — so the
 * chart doesn't show gaps. Defaults to the trailing 30 days when omitted.
 */
export async function usersGrowth(range: { from?: string; to?: string }) {
  const to = range.to ? new Date(`${range.to}T00:00:00.000Z`) : new Date();
  const from = range.from
    ? new Date(`${range.from}T00:00:00.000Z`)
    : new Date(to.getTime() - 29 * DAY_MS);

  // `to` passed to the repo is exclusive — push it one day past the last
  // calendar day the caller wants included.
  const exclusiveTo = new Date(to.getTime() + DAY_MS);
  const { rows, priorTotal } = await usersRepo.signupsByDay(from, exclusiveTo);

  const countByDay = new Map(rows.map((row) => [row.day, row.count]));
  const dayCount = Math.round(
    (exclusiveTo.getTime() - from.getTime()) / DAY_MS,
  );

  const points: { date: string; newUsers: number; totalUsers: number }[] = [];
  let runningTotal = priorTotal;

  for (let i = 0; i < dayCount; i++) {
    const day = new Date(from.getTime() + i * DAY_MS);
    const key = day.toISOString().slice(0, 10);
    const newUsers = countByDay.get(key) ?? 0;

    runningTotal += newUsers;
    points.push({ date: key, newUsers, totalUsers: runningTotal });
  }

  return points;
}

function resolveRange(range: { from?: string; to?: string }) {
  const to = range.to ? new Date(`${range.to}T00:00:00.000Z`) : new Date();
  const from = range.from
    ? new Date(`${range.from}T00:00:00.000Z`)
    : new Date(to.getTime() - 29 * DAY_MS);
  // `to` is inclusive of the calendar day the caller asked for — push the
  // exclusive upper bound one day past it, same convention as `usersGrowth`.
  const exclusiveTo = new Date(to.getTime() + DAY_MS);
  return { from, to: exclusiveTo };
}

function changePct(current: number, prior: number) {
  if (prior === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - prior) / prior) * 1000) / 10;
}

/**
 * The six analytics cards, computed range-scoped (current vs. the
 * immediately preceding period of equal length, for the change badges) plus
 * one all-time average. Every number here comes from a handful of aggregate
 * queries run in parallel — never a per-user loop — so this stays cheap
 * regardless of customer count. See `users.repo.ts` for the query shapes.
 */
export async function getUserAnalyticsMetrics(range: {
  from?: string;
  to?: string;
}) {
  const { from, to } = resolveRange(range);
  const periodMs = to.getTime() - from.getTime();
  const priorFrom = new Date(from.getTime() - periodMs);
  const priorTo = from;

  const [
    activeOrdered,
    activeOrderedPrior,
    activeSession,
    activeSessionPrior,
    stats,
    statsPrior,
    lifetimeAvg,
    totalUsers,
  ] = await Promise.all([
    usersRepo.activeOrderedCount(from, to),
    usersRepo.activeOrderedCount(priorFrom, priorTo),
    usersRepo.activeSessionCount(from, to),
    usersRepo.activeSessionCount(priorFrom, priorTo),
    usersRepo.orderStatsInRange(from, to),
    usersRepo.orderStatsInRange(priorFrom, priorTo),
    usersRepo.avgLifetimeValue(),
    usersRepo.totalUserCount(),
  ]);

  const repeatRate =
    stats.activeUsers === 0 ? 0 : (stats.repeatUsers / stats.activeUsers) * 100;
  const repeatRatePrior =
    statsPrior.activeUsers === 0
      ? 0
      : (statsPrior.repeatUsers / statsPrior.activeUsers) * 100;

  const gmvPerUser =
    stats.activeUsers === 0 ? 0 : Math.round(stats.gmv / stats.activeUsers);
  const gmvPerUserPrior =
    statsPrior.activeUsers === 0
      ? 0
      : Math.round(statsPrior.gmv / statsPrior.activeUsers);

  return {
    activeOrderedCount: activeOrdered,
    activeOrderedChangePct: changePct(activeOrdered, activeOrderedPrior),
    activeSessionCount: activeSession,
    activeSessionChangePct: changePct(activeSession, activeSessionPrior),
    repeatPurchaseRatePct: Math.round(repeatRate * 10) / 10,
    repeatPurchaseRateChangePct: changePct(repeatRate, repeatRatePrior),
    gmvPerActiveUser: toWholeRupees(gmvPerUser),
    gmvPerActiveUserChangePct: changePct(gmvPerUser, gmvPerUserPrior),
    avgLifetimeValue: toWholeRupees(lifetimeAvg),
    totalUsers,
  };
}

export async function getOrderRetention() {
  return usersRepo.orderRetentionCohort();
}
