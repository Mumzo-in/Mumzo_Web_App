import { Badge } from "@mumzo/ui/components/badge";
import { Button } from "@mumzo/ui/components/button";
import { Card, CardContent } from "@mumzo/ui/components/card";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Pencil } from "lucide-react";
import { formatDateTime, formatMoney } from "@/core/components/format";
import Loader from "@/core/components/loader";
import PageHeader from "@/core/components/page-header";
import {
  EXPENSE_CATEGORY_LABEL,
  expenseQueryOptions,
} from "@/modules/expenses";
import { usePermission } from "@/modules/roles";

export const Route = createFileRoute("/(admin)/expenses/$expenseId/")({
  component: ExpenseDetailPage,
});

function ExpenseDetailPage() {
  const { expenseId } = Route.useParams();
  const canWrite = usePermission("expense", "update");

  const { data: expense, isLoading } = useQuery(expenseQueryOptions(expenseId));

  if (isLoading || !expense) {
    return <Loader />;
  }

  return (
    <>
      <PageHeader
        actions={
          canWrite ? (
            <Button
              data-testid="admin-expense-edit-header"
              render={
                <Link params={{ expenseId }} to="/expenses/$expenseId/edit" />
              }
              variant="outline"
            >
              <Pencil data-icon="inline-start" />
              Edit
            </Button>
          ) : undefined
        }
        description={formatDateTime(expense.spentAt)}
        title={expense.title}
      />

      <div className="flex flex-wrap items-center gap-4 rounded-3xl border border-border bg-card p-5 shadow-warm">
        <div className="flex flex-col gap-2">
          <span className="numeric font-bold font-serif text-3xl">
            {formatMoney(expense.amount)}
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">
              {EXPENSE_CATEGORY_LABEL[expense.category]}
            </Badge>
            {expense.hubName ? (
              <Badge variant="outline">{expense.hubName}</Badge>
            ) : null}
            {expense.riderName ? (
              <Badge variant="outline">{expense.riderName}</Badge>
            ) : null}
          </div>
          <p className="text-muted-foreground text-sm">
            Logged by {expense.createdByName} on{" "}
            {formatDateTime(expense.createdAt)}
          </p>
        </div>
      </div>

      {expense.note ? (
        <Card className="shadow-warm">
          <CardContent className="flex flex-col gap-1 pt-6">
            <span className="text-muted-foreground text-xs">Note</span>
            <p className="text-sm">{expense.note}</p>
          </CardContent>
        </Card>
      ) : null}
    </>
  );
}
