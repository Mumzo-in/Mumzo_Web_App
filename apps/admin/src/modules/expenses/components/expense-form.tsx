import { Card, CardContent } from "@mumzo/ui/components/card";
import { useForm } from "@tanstack/react-form";
import { useQuery } from "@tanstack/react-query";
import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import {
  NumberField,
  SelectField,
  TextareaField,
  TextField,
} from "@/core/components/form-fields";
import { hubsAllQueryOptions } from "@/modules/hub";
import type { Expense, ExpenseInput } from "../api/expenses-api";
import {
  EXPENSE_CATEGORIES,
  EXPENSE_CATEGORY_LABEL,
} from "../data/expense-data";
import { expenseRidersQueryOptions } from "../queries/expenses";

const CATEGORY_OPTIONS = EXPENSE_CATEGORIES.map((value) => ({
  value,
  label: EXPENSE_CATEGORY_LABEL[value],
}));

const NONE_VALUE = "__none__";

/** Form-local shape — `hubId`/`riderId`/`note` use string sentinels instead
 * of `null` because `SelectField`/`TextareaField` bind directly to TanStack
 * Form's string state; `toInput` below converts back to `ExpenseInput`. */
type ExpenseFormValues = {
  category: string;
  amount: number;
  hubId: string;
  riderId: string;
  title: string;
  note: string;
  receiptUrl: string;
  spentAt: string;
};

const schema = z.object({
  category: z.enum(EXPENSE_CATEGORIES as [string, ...string[]]),
  amount: z.number().positive("Amount must be greater than zero."),
  hubId: z.string(),
  riderId: z.string(),
  title: z.string().min(1, "Give the expense a title.").max(160),
  note: z.string(),
  receiptUrl: z.string(),
  spentAt: z.string().min(1, "Pick a date."),
});

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function emptyValues(): ExpenseFormValues {
  return {
    category: "other",
    amount: 0,
    hubId: NONE_VALUE,
    riderId: NONE_VALUE,
    title: "",
    note: "",
    receiptUrl: "",
    spentAt: todayIso(),
  };
}

function valuesFrom(expense: Expense): ExpenseFormValues {
  return {
    category: expense.category,
    amount: expense.amount,
    hubId: expense.hubId ?? NONE_VALUE,
    riderId: expense.riderId ?? NONE_VALUE,
    title: expense.title,
    note: expense.note ?? "",
    receiptUrl: expense.receiptUrl ?? "",
    spentAt: expense.spentAt.slice(0, 10),
  };
}

function toInput(values: ExpenseFormValues): ExpenseInput {
  return {
    category: values.category as ExpenseInput["category"],
    amount: values.amount,
    hubId: values.hubId === NONE_VALUE ? null : values.hubId,
    riderId: values.riderId === NONE_VALUE ? null : values.riderId,
    title: values.title,
    note: values.note.trim().length > 0 ? values.note : null,
    receiptUrl: values.receiptUrl.length > 0 ? values.receiptUrl : null,
    spentAt: values.spentAt,
  };
}

export type ExpenseFormHandle = {
  submit: () => void;
};

export const ExpenseForm = forwardRef<
  ExpenseFormHandle,
  {
    /** Present for edit; absent for create. */
    expense?: Expense;
    onSubmit: (values: ExpenseInput) => Promise<void>;
    onPendingChange?: (pending: boolean) => void;
  }
>(function ExpenseForm({ expense, onSubmit, onPendingChange }, ref) {
  const [pending, setPending] = useState(false);
  const { data: hubs } = useQuery(hubsAllQueryOptions);
  const { data: riders } = useQuery(expenseRidersQueryOptions);

  const hubOptions = [
    { value: NONE_VALUE, label: "No hub (company-wide)" },
    ...(hubs ?? []).map((hub) => ({ value: hub.id, label: hub.name })),
  ];
  const riderOptions = [
    { value: NONE_VALUE, label: "No driver" },
    ...(riders ?? []).map((rider) => ({ value: rider.id, label: rider.name })),
  ];

  const form = useForm({
    defaultValues: expense ? valuesFrom(expense) : emptyValues(),
    validators: { onSubmit: schema },
    onSubmit: async ({ value }) => {
      setPending(true);
      try {
        await onSubmit(toInput(value));
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Couldn't save the expense.",
        );
      } finally {
        setPending(false);
      }
    },
  });

  useEffect(() => {
    onPendingChange?.(pending);
  }, [pending, onPendingChange]);

  useImperativeHandle(ref, () => ({
    submit: () => form.handleSubmit(),
  }));

  return (
    <form
      data-testid="admin-expense-form"
      onSubmit={(event) => {
        event.preventDefault();
        event.stopPropagation();
        form.handleSubmit();
      }}
    >
      <Card className="shadow-warm">
        <CardContent className="grid gap-5 pt-6 md:grid-cols-2">
          <div className="md:col-span-2">
            <form.Field name="title">
              {(field) => (
                <TextField
                  field={field}
                  label="Title"
                  placeholder="August hub rent — Gachibowli"
                  testId="admin-expense-title"
                />
              )}
            </form.Field>
          </div>

          <form.Field name="category">
            {(field) => (
              <SelectField
                field={field}
                label="Category"
                options={CATEGORY_OPTIONS}
                testId="admin-expense-category"
              />
            )}
          </form.Field>

          <form.Field name="amount">
            {(field) => (
              <NumberField
                description="In rupees."
                field={field}
                label="Amount"
                testId="admin-expense-amount"
              />
            )}
          </form.Field>

          <form.Field name="spentAt">
            {(field) => (
              <TextField
                field={field}
                label="Date"
                placeholder="YYYY-MM-DD"
                testId="admin-expense-date"
              />
            )}
          </form.Field>

          <form.Field name="hubId">
            {(field) => (
              <SelectField
                field={field}
                label="Hub"
                options={hubOptions}
                testId="admin-expense-hub"
              />
            )}
          </form.Field>

          <form.Field name="riderId">
            {(field) => (
              <SelectField
                field={field}
                label="Driver"
                options={riderOptions}
                testId="admin-expense-rider"
              />
            )}
          </form.Field>

          <div className="md:col-span-2">
            <form.Field name="note">
              {(field) => (
                <TextareaField
                  description="Optional context for finance."
                  field={field}
                  label="Note"
                  testId="admin-expense-note"
                />
              )}
            </form.Field>
          </div>
        </CardContent>
      </Card>
    </form>
  );
});

export default ExpenseForm;
