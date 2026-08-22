import { createRoute, z } from "@hono/zod-openapi";

import {
  authErrorResponses,
  jsonContent,
  paginatedSchema,
  successSchema,
} from "@/core";
import {
  createExpenseSchema,
  expenseIdParamSchema,
  expenseRiderOptionSchema,
  expenseSchema,
  expenseSummarySchema,
  listExpensesQuerySchema,
  updateExpenseSchema,
} from "./expenses.schema";

const TAG = "Admin | Expenses";

export const listRoute = createRoute({
  method: "get",
  path: "/",
  tags: [TAG],
  summary: "List expenses",
  security: [{ cookieAuth: [] }],
  request: { query: listExpensesQuerySchema },
  responses: {
    200: jsonContent(paginatedSchema(expenseSchema), "Page of expenses"),
    ...authErrorResponses,
  },
});

export const summaryRoute = createRoute({
  method: "get",
  path: "/summary",
  tags: [TAG],
  summary: "Total spend and per-category breakdown for the current filters",
  security: [{ cookieAuth: [] }],
  request: { query: listExpensesQuerySchema.omit({ page: true, limit: true }) },
  responses: {
    200: jsonContent(successSchema(expenseSummarySchema), "Expense summary"),
    ...authErrorResponses,
  },
});

export const riderOptionsRoute = createRoute({
  method: "get",
  path: "/riders",
  tags: [TAG],
  summary: "Riders for the expense form's driver picker",
  security: [{ cookieAuth: [] }],
  responses: {
    200: jsonContent(
      successSchema(z.array(expenseRiderOptionSchema)),
      "Riders",
    ),
    ...authErrorResponses,
  },
});

export const getRoute = createRoute({
  method: "get",
  path: "/{id}",
  tags: [TAG],
  summary: "Get an expense by id",
  security: [{ cookieAuth: [] }],
  request: { params: expenseIdParamSchema },
  responses: {
    200: jsonContent(successSchema(expenseSchema), "Expense"),
    ...authErrorResponses,
  },
});

export const createRouteDef = createRoute({
  method: "post",
  path: "/",
  tags: [TAG],
  summary: "Log a new expense",
  security: [{ cookieAuth: [] }],
  request: {
    body: { content: { "application/json": { schema: createExpenseSchema } } },
  },
  responses: {
    201: jsonContent(successSchema(expenseSchema), "Created"),
    ...authErrorResponses,
  },
});

export const updateRouteDef = createRoute({
  method: "patch",
  path: "/{id}",
  tags: [TAG],
  summary: "Update an expense",
  security: [{ cookieAuth: [] }],
  request: {
    params: expenseIdParamSchema,
    body: { content: { "application/json": { schema: updateExpenseSchema } } },
  },
  responses: {
    200: jsonContent(successSchema(expenseSchema), "Updated"),
    ...authErrorResponses,
  },
});

export const deleteRouteDef = createRoute({
  method: "delete",
  path: "/{id}",
  tags: [TAG],
  summary: "Delete an expense",
  security: [{ cookieAuth: [] }],
  request: { params: expenseIdParamSchema },
  responses: {
    200: jsonContent(
      successSchema(z.object({ ok: z.literal(true) })),
      "Deleted",
    ),
    ...authErrorResponses,
  },
});
