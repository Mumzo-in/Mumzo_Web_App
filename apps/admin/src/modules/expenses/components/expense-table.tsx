import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@mumzo/ui/components/alert-dialog";
import { Badge } from "@mumzo/ui/components/badge";
import { Button } from "@mumzo/ui/components/button";
import { Input } from "@mumzo/ui/components/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@mumzo/ui/components/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { queryKeys } from "@/core/api/query-keys";
import { usePaginatedList } from "@/core/api/use-paginated-list";
import DataTable from "@/core/components/data-table";
import { formatDateTime, formatMoney } from "@/core/components/format";
import { usePermission } from "@/modules/roles";
import { deleteExpense, type Expense, listExpenses } from "../api/expenses-api";
import {
  EXPENSE_CATEGORIES,
  EXPENSE_CATEGORY_LABEL,
} from "../data/expense-data";

const ALL_CATEGORIES = "__all__";
const CATEGORY_FILTER_OPTIONS = [
  { value: ALL_CATEGORIES, label: "All categories" },
  ...EXPENSE_CATEGORIES.map((value) => ({
    value,
    label: EXPENSE_CATEGORY_LABEL[value],
  })),
];

export function ExpenseTable() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>(ALL_CATEGORIES);
  const canWrite = usePermission("expense", "update");
  const canDelete = usePermission("expense", "delete");
  const [pendingDelete, setPendingDelete] = useState<{
    id: string;
    title: string;
  } | null>(null);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteExpense(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.expenses.all });
      setPendingDelete(null);
      toast.success("Expense deleted.");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Could not delete the expense.");
      setPendingDelete(null);
    },
  });

  const columns = useMemo<ColumnDef<Expense, unknown>[]>(
    () => [
      {
        accessorKey: "title",
        header: "Expense",
        cell: ({ row }) => (
          <div className="flex flex-col gap-0.5">
            <span className="font-medium">{row.original.title}</span>
            <span className="text-muted-foreground text-xs">
              {formatDateTime(row.original.spentAt)}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "category",
        header: "Category",
        enableSorting: false,
        cell: ({ row }) => (
          <Badge variant="secondary">
            {EXPENSE_CATEGORY_LABEL[row.original.category]}
          </Badge>
        ),
      },
      {
        id: "linked",
        header: "Hub / Driver",
        enableSorting: false,
        cell: ({ row }) => (
          <span className="text-muted-foreground text-xs">
            {[row.original.hubName, row.original.riderName]
              .filter(Boolean)
              .join(" · ") || "—"}
          </span>
        ),
      },
      {
        accessorKey: "amount",
        header: "Amount",
        cell: ({ row }) => (
          <span className="numeric font-medium">
            {formatMoney(row.original.amount)}
          </span>
        ),
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        cell: ({ row }) => {
          const expense = row.original;
          return (
            <div className="flex justify-end">
              <Button
                data-testid={`admin-expense-view-${expense.id}`}
                onClick={(event) => event.stopPropagation()}
                render={
                  <Link
                    params={{ expenseId: expense.id }}
                    to="/expenses/$expenseId"
                  />
                }
                size="sm"
                variant="outline"
              >
                <Eye className="size-3.5" data-icon="inline-start" />
                View
              </Button>
              {canWrite ? (
                <Button
                  className="ml-2"
                  data-testid={`admin-expense-edit-${expense.id}`}
                  onClick={(event) => event.stopPropagation()}
                  render={
                    <Link
                      params={{ expenseId: expense.id }}
                      to="/expenses/$expenseId/edit"
                    />
                  }
                  size="sm"
                  variant="outline"
                >
                  <Pencil className="size-3.5" data-icon="inline-start" />
                  Edit
                </Button>
              ) : null}
              {canDelete ? (
                <Button
                  className="ml-2 hover:border-destructive/20 hover:bg-destructive/10 hover:text-destructive"
                  disabled={deleteMutation.isPending}
                  onClick={(event) => {
                    event.stopPropagation();
                    setPendingDelete({ id: expense.id, title: expense.title });
                  }}
                  size="sm"
                  variant="outline"
                >
                  <Trash2 className="size-3.5" data-icon="inline-start" />
                  Delete
                </Button>
              ) : null}
            </div>
          );
        },
      },
    ],
    [canWrite, canDelete, deleteMutation.isPending],
  );

  const filters = useMemo(
    () => ({
      search: search || undefined,
      category: category === ALL_CATEGORIES ? undefined : category,
    }),
    [search, category],
  );

  const list = usePaginatedList({
    queryKey: queryKeys.expenses.lists(),
    fetcher: listExpenses,
    columns,
    filters,
    initialLimit: 20,
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <Input
          className="max-w-xs"
          data-testid="admin-expenses-search"
          onChange={(event) => {
            setSearch(event.target.value);
            list.resetToFirstPage();
          }}
          placeholder="Search expenses…"
          value={search}
        />

        <Select
          onValueChange={(value) => {
            if (value === null) {
              return;
            }
            setCategory(value);
            list.resetToFirstPage();
          }}
          value={category}
        >
          <SelectTrigger
            className="w-56"
            data-testid="admin-expenses-category-filter"
          >
            <SelectValue>
              {(value: string) =>
                CATEGORY_FILTER_OPTIONS.find((option) => option.value === value)
                  ?.label ?? "All categories"
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {CATEGORY_FILTER_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      <DataTable
        emptyDescription="Log a business expense to start tracking spend."
        emptyTitle="No expenses yet"
        error={list.error}
        hasNext={list.hasNext}
        hasPrev={list.hasPrev}
        isFetching={list.isFetching}
        isLoading={list.isLoading}
        meta={list.meta}
        onPageChange={list.setPage}
        onPageSizeChange={(size) => {
          list.setLimit(size);
          list.resetToFirstPage();
        }}
        page={list.page}
        pageSize={list.limit}
        table={list.table}
        testId="admin-expenses-table"
      />

      <AlertDialog
        onOpenChange={(open) => {
          if (!open) {
            setPendingDelete(null);
          }
        }}
        open={pendingDelete !== null}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this expense?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete?.title} will be removed. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteMutation.isPending}
              onClick={() => {
                if (pendingDelete) {
                  deleteMutation.mutate(pendingDelete.id);
                }
              }}
            >
              {deleteMutation.isPending ? "Deleting…" : "Delete expense"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default ExpenseTable;
