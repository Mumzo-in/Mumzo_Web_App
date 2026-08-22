import { Button } from "@mumzo/ui/components/button";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import PageHeader from "@/core/components/page-header";
import { ExpenseTable } from "@/modules/expenses";
import { usePermission } from "@/modules/roles";

export const Route = createFileRoute("/(admin)/expenses/")({
  component: ExpensesPage,
});

function ExpensesPage() {
  const canWrite = usePermission("expense", "create");

  return (
    <>
      <PageHeader
        actions={
          canWrite ? (
            <Button
              data-testid="admin-expense-new"
              render={<Link to="/expenses/new" />}
            >
              <Plus data-icon="inline-start" />
              New expense
            </Button>
          ) : null
        }
        description="Rent, utilities, salaries, driver payouts, and other business spend."
        title="Expenses"
      />
      <ExpenseTable />
    </>
  );
}
