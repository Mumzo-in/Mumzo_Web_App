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
import { Button } from "@mumzo/ui/components/button";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { queryKeys } from "@/core/api/query-keys";
import Loader from "@/core/components/loader";
import PageHeader from "@/core/components/page-header";
import {
  deleteExpense,
  ExpenseForm,
  type ExpenseFormHandle,
  expenseQueryOptions,
  updateExpense,
} from "@/modules/expenses";
import { usePermission } from "@/modules/roles";

export const Route = createFileRoute("/(admin)/expenses/$expenseId/edit")({
  component: EditExpensePage,
});

function EditExpensePage() {
  const { expenseId } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const formRef = useRef<ExpenseFormHandle>(null);
  const [pending, setPending] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const canDelete = usePermission("expense", "delete");

  const { data: expense, isLoading } = useQuery(expenseQueryOptions(expenseId));

  const deleteMutation = useMutation({
    mutationFn: () => deleteExpense(expenseId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.expenses.all });
      toast.success("Expense deleted.");
      navigate({ to: "/expenses" });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Could not delete the expense.");
      setConfirmDelete(false);
    },
  });

  if (isLoading || !expense) {
    return <Loader />;
  }

  async function handleUpdate(values: Parameters<typeof updateExpense>[1]) {
    await updateExpense(expenseId, values);
    await queryClient.invalidateQueries({ queryKey: queryKeys.expenses.all });
    toast.success("Saved.");
    navigate({ to: "/expenses/$expenseId", params: { expenseId } });
  }

  return (
    <>
      <PageHeader
        actions={
          <>
            {canDelete ? (
              <Button
                className="hover:border-destructive/20 hover:bg-destructive/10 hover:text-destructive"
                data-testid="admin-expense-delete"
                onClick={() => setConfirmDelete(true)}
                type="button"
                variant="outline"
              >
                <Trash2 data-icon="inline-start" />
                Delete
              </Button>
            ) : null}
            <Button
              data-testid="admin-expense-submit-header"
              disabled={pending}
              onClick={() => formRef.current?.submit()}
              type="button"
            >
              {pending ? "Saving…" : "Save changes"}
            </Button>
          </>
        }
        description="Update this expense's details."
        title={`Edit ${expense.title}`}
      />
      <ExpenseForm
        expense={expense}
        onPendingChange={setPending}
        onSubmit={handleUpdate}
        ref={formRef}
      />

      <AlertDialog
        onOpenChange={(open) => {
          if (!open) {
            setConfirmDelete(false);
          }
        }}
        open={confirmDelete}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this expense?</AlertDialogTitle>
            <AlertDialogDescription>
              {expense.title} will be removed. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate()}
            >
              {deleteMutation.isPending ? "Deleting…" : "Delete expense"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
