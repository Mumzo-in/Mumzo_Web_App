import { db } from "@mumzo/db";
import { hub } from "@mumzo/db/schema/catalog";
import { rider } from "@mumzo/db/schema/delivery";
import { expense } from "@mumzo/db/schema/expenses";
import { staffUser } from "@mumzo/db/schema/staff";
import { and, desc, eq, gte, ilike, lte, or, sql } from "drizzle-orm";

/** Pure data access — no business rules. `expenses.service.ts` owns those. */

const withJoins = () =>
  db
    .select({
      id: expense.id,
      category: expense.category,
      amount: expense.amount,
      hubId: expense.hubId,
      hubName: hub.name,
      riderId: expense.riderId,
      riderName: rider.name,
      title: expense.title,
      note: expense.note,
      receiptUrl: expense.receiptUrl,
      spentAt: expense.spentAt,
      createdById: expense.createdById,
      createdByName: staffUser.name,
      createdAt: expense.createdAt,
      updatedAt: expense.updatedAt,
    })
    .from(expense)
    .leftJoin(hub, eq(expense.hubId, hub.id))
    .leftJoin(rider, eq(expense.riderId, rider.id))
    .innerJoin(staffUser, eq(expense.createdById, staffUser.id));

export type ExpenseFilters = {
  page: number;
  limit: number;
  category?: string;
  hubId?: string;
  riderId?: string;
  search?: string;
  from?: string;
  to?: string;
};

function buildWhere(filters: ExpenseFilters) {
  const conditions = [
    filters.category ? eq(expense.category, filters.category) : undefined,
    filters.hubId ? eq(expense.hubId, filters.hubId) : undefined,
    filters.riderId ? eq(expense.riderId, filters.riderId) : undefined,
    filters.search
      ? or(
          ilike(expense.title, `%${filters.search}%`),
          ilike(expense.note, `%${filters.search}%`),
        )
      : undefined,
    filters.from
      ? gte(expense.spentAt, new Date(`${filters.from}T00:00:00.000Z`))
      : undefined,
    filters.to
      ? lte(expense.spentAt, new Date(`${filters.to}T23:59:59.999Z`))
      : undefined,
  ].filter((c): c is NonNullable<typeof c> => c !== undefined);

  return conditions.length > 0 ? and(...conditions) : undefined;
}

export async function findMany(filters: ExpenseFilters) {
  const where = buildWhere(filters);
  const offset = (filters.page - 1) * filters.limit;

  const rows = await withJoins()
    .where(where)
    .orderBy(desc(expense.spentAt))
    .limit(filters.limit)
    .offset(offset);

  const [countRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(expense)
    .where(where);

  return { rows, count: countRow?.count ?? 0 };
}

export async function findById(id: string) {
  const [row] = await withJoins().where(eq(expense.id, id)).limit(1);
  return row;
}

export async function insert(input: {
  category: string;
  amount: number;
  hubId?: string | null;
  riderId?: string | null;
  title: string;
  note?: string | null;
  receiptUrl?: string | null;
  spentAt?: Date;
  createdById: string;
}) {
  const [row] = await db
    .insert(expense)
    .values(input)
    .returning({ id: expense.id });
  if (!row) {
    throw new Error("Insert into expense returned no row.");
  }
  return row.id;
}

export async function update(
  id: string,
  input: Partial<{
    category: string;
    amount: number;
    hubId: string | null;
    riderId: string | null;
    title: string;
    note: string | null;
    receiptUrl: string | null;
    spentAt: Date;
  }>,
) {
  await db.update(expense).set(input).where(eq(expense.id, id));
}

export async function remove(id: string) {
  await db.delete(expense).where(eq(expense.id, id));
}

export async function summary(filters: Omit<ExpenseFilters, "page" | "limit">) {
  const where = buildWhere({ ...filters, page: 1, limit: 1 });

  const [totalRow] = await db
    .select({
      totalAmount: sql<number>`coalesce(sum(${expense.amount}), 0)::int`,
      count: sql<number>`count(*)::int`,
    })
    .from(expense)
    .where(where);

  const byCategory = await db
    .select({
      category: expense.category,
      amount: sql<number>`coalesce(sum(${expense.amount}), 0)::int`,
    })
    .from(expense)
    .where(where)
    .groupBy(expense.category)
    .orderBy(desc(sql`sum(${expense.amount})`));

  return {
    totalAmount: totalRow?.totalAmount ?? 0,
    count: totalRow?.count ?? 0,
    byCategory,
  };
}

/** Riders — for the expense form's driver picker. No dedicated rider admin
 * surface exists yet, so this stays scoped to the expenses module. */
export async function listActiveRiders() {
  return db
    .select({ id: rider.id, name: rider.name })
    .from(rider)
    .orderBy(rider.name);
}
