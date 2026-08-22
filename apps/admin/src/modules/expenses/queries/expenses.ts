import { queryOptions } from "@tanstack/react-query";
import { queryKeys } from "@/core/api/query-keys";
import { getExpense, listExpenseRiders } from "../api/expenses-api";

export const expenseQueryOptions = (id: string) =>
  queryOptions({
    queryKey: queryKeys.expenses.detail(id),
    queryFn: () => getExpense(id),
    staleTime: 30_000,
  });

export const expenseRidersQueryOptions = queryOptions({
  queryKey: queryKeys.expenses.riders(),
  queryFn: listExpenseRiders,
  staleTime: 60_000,
});
