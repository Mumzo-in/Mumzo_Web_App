import { db } from "@mumzo/db";
import { baby } from "@mumzo/db/schema/account";
import { user } from "@mumzo/db/schema/auth";
import { and, desc, gte, inArray, lt, sql } from "drizzle-orm";

import type { RecentUser, UserCounts } from "./schema";

const DAY_MS = 24 * 60 * 60 * 1000;
const RECENT_USERS_LIMIT = 5;

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
