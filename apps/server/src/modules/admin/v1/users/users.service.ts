import { notFound } from "@/core/errors";
import * as usersRepo from "./users.repo";

type UserRow = NonNullable<Awaited<ReturnType<typeof usersRepo.findById>>>;

/**
 * `orderCount`/`lifetimeValue`/`lastOrderAt` are always 0/null — there is no
 * `order` table yet, so these stay honest placeholders rather than fabricated
 * numbers (matches `modules/admin/v1/dashboard/service.ts`'s `recentUsers`).
 *
 * `status` is always "active" — the customer `user` table has no ban/status
 * column yet (unlike `staffUser`, which gets one from the admin plugin).
 */
function serialize(row: UserRow, babies: { name: string; dob: string }[]) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phoneNumber,
    status: "active" as const,
    orderCount: 0,
    lifetimeValue: 0,
    babies,
    joinedAt: row.createdAt.toISOString(),
    lastOrderAt: null,
  };
}

export async function listUsers(filters: {
  page: number;
  limit: number;
  search?: string;
  sortBy: "joinedAt" | "name";
  sortDir: "asc" | "desc";
}) {
  const { rows, total } = await usersRepo.findPage(filters);
  const babiesByUser = await usersRepo.babiesByUserId(rows.map((r) => r.id));

  return {
    data: rows.map((row) => serialize(row, babiesByUser.get(row.id) ?? [])),
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

  const babiesByUser = await usersRepo.babiesByUserId([id]);
  return serialize(row, babiesByUser.get(id) ?? []);
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
