import { notFound } from "@/core/errors";
import { toPaise, toWholeRupees } from "@/lib/money";
import * as expensesRepo from "./expenses.repo";
import type { expenseCategorySchema } from "./expenses.schema";

type ExpenseCategory = (typeof expenseCategorySchema)["_output"];
type ExpenseRow = NonNullable<
  Awaited<ReturnType<typeof expensesRepo.findById>>
>;

function serialize(row: ExpenseRow) {
  return {
    id: row.id,
    category: row.category as ExpenseCategory,
    amount: toWholeRupees(row.amount),
    hubId: row.hubId,
    hubName: row.hubName,
    riderId: row.riderId,
    riderName: row.riderName,
    title: row.title,
    note: row.note,
    receiptUrl: row.receiptUrl,
    spentAt: row.spentAt.toISOString(),
    createdById: row.createdById,
    createdByName: row.createdByName,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function listExpenses(filters: {
  page: number;
  limit: number;
  category?: string;
  hubId?: string;
  riderId?: string;
  search?: string;
  from?: string;
  to?: string;
}) {
  const { rows, count } = await expensesRepo.findMany(filters);

  return {
    data: rows.map(serialize),
    meta: {
      page: filters.page,
      limit: filters.limit,
      total: count,
      hasNext: filters.page * filters.limit < count,
    },
  };
}

async function requireExpense(id: string) {
  const row = await expensesRepo.findById(id);
  if (!row) {
    throw notFound("Expense");
  }
  return row;
}

export async function getExpense(id: string) {
  const row = await requireExpense(id);
  return serialize(row);
}

export async function createExpense(
  input: {
    category: string;
    amount: number;
    hubId?: string | null;
    riderId?: string | null;
    title: string;
    note?: string | null;
    receiptUrl?: string | null;
    spentAt?: string;
  },
  createdById: string,
) {
  const id = await expensesRepo.insert({
    category: input.category,
    amount: toPaise(input.amount),
    hubId: input.hubId ?? null,
    riderId: input.riderId ?? null,
    title: input.title,
    note: input.note ?? null,
    receiptUrl: input.receiptUrl ?? null,
    spentAt: input.spentAt ? new Date(input.spentAt) : undefined,
    createdById,
  });
  return getExpense(id);
}

export async function updateExpense(
  id: string,
  input: Partial<{
    category: string;
    amount: number;
    hubId: string | null;
    riderId: string | null;
    title: string;
    note: string | null;
    receiptUrl: string | null;
    spentAt: string;
  }>,
) {
  await requireExpense(id);

  await expensesRepo.update(id, {
    ...input,
    amount: input.amount !== undefined ? toPaise(input.amount) : undefined,
    spentAt: input.spentAt ? new Date(input.spentAt) : undefined,
  });

  return getExpense(id);
}

export async function deleteExpense(id: string) {
  await requireExpense(id);
  await expensesRepo.remove(id);
}

export async function expenseSummary(filters: {
  category?: string;
  hubId?: string;
  riderId?: string;
  search?: string;
  from?: string;
  to?: string;
}) {
  const { totalAmount, count, byCategory } =
    await expensesRepo.summary(filters);

  return {
    totalAmount: toWholeRupees(totalAmount),
    count,
    byCategory: byCategory.map((row) => ({
      category: row.category as ExpenseCategory,
      amount: toWholeRupees(row.amount),
    })),
  };
}

export async function listRiderOptions() {
  return expensesRepo.listActiveRiders();
}
