import { createRoute, z } from "@hono/zod-openapi";

import {
  authErrorResponses,
  jsonContent,
  paginatedSchema,
  successSchema,
} from "@/core";
import { orderSummarySchema } from "@/modules/admin/v1/orders/orders.schema";
import {
  adminUserSchema,
  customerEventSchema,
  listUserSubResourceQuerySchema,
  listUsersQuerySchema,
  orderRetentionPointSchema,
  userAnalyticsMetricsSchema,
  userAnalyticsQuerySchema,
  userCartSchema,
  userGrowthPointSchema,
  userGrowthQuerySchema,
  userIdParamSchema,
  userWishlistItemSchema,
} from "./users.schema";

const TAG = "Admin | Customers";

export const listRoute = createRoute({
  method: "get",
  path: "/",
  tags: [TAG],
  summary: "List customers",
  security: [{ cookieAuth: [] }],
  request: { query: listUsersQuerySchema },
  responses: {
    200: jsonContent(paginatedSchema(adminUserSchema), "Page of customers"),
    ...authErrorResponses,
  },
});

export const analyticsMetricsRoute = createRoute({
  method: "get",
  path: "/analytics/metrics",
  tags: [TAG],
  summary: "Active/repeat/GMV/LTV cards for the customer analytics page",
  security: [{ cookieAuth: [] }],
  request: { query: userAnalyticsQuerySchema },
  responses: {
    200: jsonContent(
      successSchema(userAnalyticsMetricsSchema),
      "Analytics metrics",
    ),
    ...authErrorResponses,
  },
});

export const retentionRoute = createRoute({
  method: "get",
  path: "/analytics/retention",
  tags: [TAG],
  summary: "Cohort order-retention curve, months 0-6 since signup",
  security: [{ cookieAuth: [] }],
  responses: {
    200: jsonContent(
      successSchema(z.array(orderRetentionPointSchema)),
      "Retention curve",
    ),
    ...authErrorResponses,
  },
});

export const growthRoute = createRoute({
  method: "get",
  path: "/growth",
  tags: [TAG],
  summary: "Daily signups with a running total, trailing N days",
  security: [{ cookieAuth: [] }],
  request: { query: userGrowthQuerySchema },
  responses: {
    200: jsonContent(
      successSchema(z.array(userGrowthPointSchema)),
      "Growth series",
    ),
    ...authErrorResponses,
  },
});

export const getRoute = createRoute({
  method: "get",
  path: "/{id}",
  tags: [TAG],
  summary: "Get a customer",
  security: [{ cookieAuth: [] }],
  request: { params: userIdParamSchema },
  responses: {
    200: jsonContent(successSchema(adminUserSchema), "The customer"),
    ...authErrorResponses,
  },
});

export const listUserOrdersRoute = createRoute({
  method: "get",
  path: "/{id}/orders",
  tags: [TAG],
  summary: "List a customer's orders",
  security: [{ cookieAuth: [] }],
  request: {
    params: userIdParamSchema,
    query: listUserSubResourceQuerySchema,
  },
  responses: {
    200: jsonContent(
      paginatedSchema(orderSummarySchema),
      "Page of the customer's orders",
    ),
    ...authErrorResponses,
  },
});

export const getUserCartRoute = createRoute({
  method: "get",
  path: "/{id}/cart",
  tags: [TAG],
  summary: "Get a customer's current cart",
  security: [{ cookieAuth: [] }],
  request: { params: userIdParamSchema },
  responses: {
    200: jsonContent(successSchema(userCartSchema), "The customer's cart"),
    ...authErrorResponses,
  },
});

export const listUserWishlistRoute = createRoute({
  method: "get",
  path: "/{id}/wishlist",
  tags: [TAG],
  summary: "List a customer's wishlist",
  security: [{ cookieAuth: [] }],
  request: {
    params: userIdParamSchema,
    query: listUserSubResourceQuerySchema,
  },
  responses: {
    200: jsonContent(
      paginatedSchema(userWishlistItemSchema),
      "Page of the customer's wishlist",
    ),
    ...authErrorResponses,
  },
});

export const listUserActivityRoute = createRoute({
  method: "get",
  path: "/{id}/activity",
  tags: [TAG],
  summary: "List a customer's activity timeline",
  security: [{ cookieAuth: [] }],
  request: {
    params: userIdParamSchema,
    query: listUserSubResourceQuerySchema,
  },
  responses: {
    200: jsonContent(
      paginatedSchema(customerEventSchema),
      "Page of the customer's activity events",
    ),
    ...authErrorResponses,
  },
});
