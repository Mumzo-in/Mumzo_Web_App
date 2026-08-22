import { Button } from "@mumzo/ui/components/button";
import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { queryKeys } from "@/core/api/query-keys";
import PageHeader from "@/core/components/page-header";
import {
  createExpense,
  ExpenseForm,
  type ExpenseFormHandle,
} from "@/modules/expenses";

export const Route = createFileRoute("/(admin)/expenses/new")({
  component: NewExpensePage,
});

function NewExpensePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const formRef = useRef<ExpenseFormHandle>(null);
  const [pending, setPending] = useState(false);

  async function handleCreate(values: Parameters<typeof createExpense>[0]) {
    const created = await createExpense(values);
    await queryClient.invalidateQueries({ queryKey: queryKeys.expenses.all });
    toast.success(`Logged "${values.title}".`);
    navigate({
      to: "/expenses/$expenseId",
      params: { expenseId: created.id },
    });
  }

  return (
    <>
      <PageHeader
        actions={
          <Button
            data-testid="admin-expense-submit-header"
            disabled={pending}
            onClick={() => formRef.current?.submit()}
            type="button"
          >
            {pending ? "Saving…" : "Log expense"}
          </Button>
        }
        description="Record a business cost — rent, utilities, salaries, driver payouts, and more."
        title="New expense"
      />
      <ExpenseForm
        onPendingChange={setPending}
        onSubmit={handleCreate}
        ref={formRef}
      />
    </>
  );
}
