import { createRoute, z } from "@hono/zod-openapi";

import {
  authErrorResponses,
  createRouter,
  jsonContent,
  requirePermission,
  successSchema,
} from "@/core";
import {
  analyticsRangeQuerySchema,
  attentionCountsSchema,
  categorySalesPointSchema,
  orderAnalyticsSchema,
  orderDashboardSchema,
  recentUserSchema,
  userCountsSchema,
} from "./schema";
import {
  attentionCounts,
  categorySales,
  orderAnalytics,
  orderDashboard,
  recentUsers,
  userCounts,
} from "./service";

const TAG = "Admin | Dashboard";

const userCountsRoute = createRoute({
  method: "get",
  path: "/user-counts",
  tags: [TAG],
  summary: "Total customers and new signups in the trailing 24h",
  security: [{ cookieAuth: [] }],
  responses: {
    200: jsonContent(successSchema(userCountsSchema), "User counts"),
    ...authErrorResponses,
  },
});

const recentUsersRoute = createRoute({
  method: "get",
  path: "/recent-users",
  tags: [TAG],
  summary: "Most recently registered customers",
  security: [{ cookieAuth: [] }],
  responses: {
    200: jsonContent(
      successSchema(z.array(recentUserSchema)),
      "Recent customers",
    ),
    ...authErrorResponses,
  },
});

const orderDashboardRoute = createRoute({
  method: "get",
  path: "/orders",
  tags: [TAG],
  summary: "GMV, order count, AOV, revenue trend, and recent orders",
  security: [{ cookieAuth: [] }],
  responses: {
    200: jsonContent(successSchema(orderDashboardSchema), "Order dashboard"),
    ...authErrorResponses,
  },
});

const orderAnalyticsRoute = createRoute({
  method: "get",
  path: "/analytics",
  tags: [TAG],
  summary: "Range-filtered revenue/order/hub/payment breakdown",
  security: [{ cookieAuth: [] }],
  request: { query: analyticsRangeQuerySchema },
  responses: {
    200: jsonContent(successSchema(orderAnalyticsSchema), "Order analytics"),
    ...authErrorResponses,
  },
});

const attentionCountsRoute = createRoute({
  method: "get",
  path: "/attention",
  tags: [TAG],
  summary: "Low-stock and pending-refund counts for the attention bar",
  security: [{ cookieAuth: [] }],
  responses: {
    200: jsonContent(successSchema(attentionCountsSchema), "Attention counts"),
    ...authErrorResponses,
  },
});

const categorySalesRoute = createRoute({
  method: "get",
  path: "/category-sales",
  tags: [TAG],
  summary: "All-time GMV contribution by category",
  security: [{ cookieAuth: [] }],
  responses: {
    200: jsonContent(
      successSchema(z.array(categorySalesPointSchema)),
      "Category sales",
    ),
    ...authErrorResponses,
  },
});

const app = createRouter();

app.use("/*", requirePermission("report", "read"));

const dashboard = app
  .openapi(userCountsRoute, async (c) =>
    c.json({ success: true as const, data: await userCounts() }, 200),
  )
  .openapi(recentUsersRoute, async (c) =>
    c.json({ success: true as const, data: await recentUsers() }, 200),
  )
  .openapi(orderDashboardRoute, async (c) =>
    c.json({ success: true as const, data: await orderDashboard() }, 200),
  )
  .openapi(orderAnalyticsRoute, async (c) => {
    const { from, to } = c.req.valid("query");
    return c.json(
      { success: true as const, data: await orderAnalytics(from, to) },
      200,
    );
  })
  .openapi(attentionCountsRoute, async (c) =>
    c.json({ success: true as const, data: await attentionCounts() }, 200),
  )
  .openapi(categorySalesRoute, async (c) =>
    c.json({ success: true as const, data: await categorySales() }, 200),
  );

export default dashboard;
