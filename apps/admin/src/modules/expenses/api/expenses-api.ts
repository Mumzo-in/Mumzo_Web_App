import { apiRequest, type Paginated } from "@/core/api/client";
import type { ListParams } from "@/core/api/query-keys";
import type { ExpenseCategory } from "../data/expense-data";

export type Expense = {
  id: string;
  category: ExpenseCategory;
  amount: number;
  hubId: string | null;
  hubName: string | null;
  riderId: string | null;
  riderName: string | null;
  title: string;
  note: string | null;
  receiptUrl: string | null;
  spentAt: string;
  createdById: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
};

export type ExpenseInput = {
  category: ExpenseCategory;
  amount: number;
  hubId: string | null;
  riderId: string | null;
  title: string;
  note: string | null;
  receiptUrl: string | null;
  spentAt: string;
};

export type ExpenseSummary = {
  totalAmount: number;
  count: number;
  byCategory: { category: ExpenseCategory; amount: number }[];
};

export type RiderOption = { id: string; name: string };

export function listExpenses(params: ListParams): Promise<Paginated<Expense>> {
  return apiRequest<Paginated<Expense>>("/expenses", { query: params });
}

export function getExpense(id: string): Promise<Expense> {
  return apiRequest<Expense>(`/expenses/${encodeURIComponent(id)}`);
}

export function createExpense(input: ExpenseInput): Promise<Expense> {
  return apiRequest<Expense>("/expenses", { method: "POST", body: input });
}

export function updateExpense(
  id: string,
  input: Partial<ExpenseInput>,
): Promise<Expense> {
  return apiRequest<Expense>(`/expenses/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: input,
  });
}

export function deleteExpense(id: string): Promise<{ ok: true }> {
  return apiRequest<{ ok: true }>(`/expenses/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

export function getExpenseSummary(
  params: Omit<ListParams, "page" | "limit">,
): Promise<ExpenseSummary> {
  return apiRequest<ExpenseSummary>("/expenses/summary", { query: params });
}

export function listExpenseRiders(): Promise<RiderOption[]> {
  return apiRequest<RiderOption[]>("/expenses/riders");
}
