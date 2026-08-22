import { z } from "@hono/zod-openapi";

export const expenseCategorySchema = z.enum([
  "rent",
  "utilities",
  "salaries",
  "marketing",
  "hub_ops",
  "delivery_fuel",
  "equipment",
  "maintenance",
  "software",
  "other",
]);

export const expenseSchema = z
  .object({
    id: z.string(),
    category: expenseCategorySchema,
    /** Whole rupees — paise is an API-internal storage detail. */
    amount: z.number(),
    hubId: z.string().nullable(),
    hubName: z.string().nullable(),
    riderId: z.string().nullable(),
    riderName: z.string().nullable(),
    title: z.string(),
    note: z.string().nullable(),
    receiptUrl: z.string().nullable(),
    spentAt: z.string(),
    createdById: z.string(),
    createdByName: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .openapi("Expense");

export const createExpenseSchema = z.object({
  category: expenseCategorySchema,
  amount: z.number().positive(),
  hubId: z.string().nullable().optional(),
  riderId: z.string().nullable().optional(),
  title: z.string().min(1).max(160),
  note: z.string().max(1000).nullable().optional(),
  receiptUrl: z.string().nullable().optional(),
  spentAt: z.string().optional(),
});

export const updateExpenseSchema = createExpenseSchema.partial();

export const expenseIdParamSchema = z.object({
  id: z
    .string()
    .min(1)
    .openapi({ param: { name: "id", in: "path" } }),
});

export const listExpensesQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(200).default(20),
  category: expenseCategorySchema.optional(),
  hubId: z.string().optional(),
  riderId: z.string().optional(),
  search: z.string().trim().min(1).optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});

export const expenseSummarySchema = z
  .object({
    totalAmount: z.number(),
    count: z.number().int(),
    byCategory: z
      .object({ category: expenseCategorySchema, amount: z.number() })
      .array(),
  })
  .openapi("ExpenseSummary");

export const expenseRiderOptionSchema = z
  .object({ id: z.string(), name: z.string() })
  .openapi("ExpenseRiderOption");
