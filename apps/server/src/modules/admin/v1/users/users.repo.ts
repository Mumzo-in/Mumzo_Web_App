import { db } from "@mumzo/db";
import { baby } from "@mumzo/db/schema/account";
import { user } from "@mumzo/db/schema/auth";
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
