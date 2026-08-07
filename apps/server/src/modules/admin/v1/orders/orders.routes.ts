import { createRoute } from "@hono/zod-openapi";

import {
  authErrorResponses,
  jsonContent,
  paginatedSchema,
  successSchema,
} from "@/core";
import {
  createOrderSchema,
  listOrdersQuerySchema,
  orderDetailSchema,
  orderIdParamSchema,
  orderSummarySchema,
  updateOrderStatusSchema,
} from "./orders.schema";

const TAG = "Admin | Orders";

export const createRouteDef = createRoute({
  method: "post",
  path: "/",
  tags: [TAG],
  summary: "Create a manual (phone/walk-in) order",
  security: [{ cookieAuth: [] }],
  request: {
    body: {
      content: { "application/json": { schema: createOrderSchema } },
    },
  },
  responses: {
    200: jsonContent(successSchema(orderDetailSchema), "Order created"),
    ...authErrorResponses,
  },
});

export const listRoute = createRoute({
  method: "get",
  path: "/",
  tags: [TAG],
  summary: "List orders",
  security: [{ cookieAuth: [] }],
  request: { query: listOrdersQuerySchema },
  responses: {
    200: jsonContent(paginatedSchema(orderSummarySchema), "Page of orders"),
    ...authErrorResponses,
  },
});

export const getRoute = createRoute({
  method: "get",
  path: "/{id}",
  tags: [TAG],
  summary: "Order detail + status timeline",
  security: [{ cookieAuth: [] }],
  request: { params: orderIdParamSchema },
  responses: {
    200: jsonContent(successSchema(orderDetailSchema), "Order detail"),
    ...authErrorResponses,
  },
});

export const updateStatusRoute = createRoute({
  method: "patch",
  path: "/{id}/status",
  tags: [TAG],
  summary: "Move an order to its next status",
  security: [{ cookieAuth: [] }],
  request: {
    params: orderIdParamSchema,
    body: {
      content: { "application/json": { schema: updateOrderStatusSchema } },
    },
  },
  responses: {
    200: jsonContent(successSchema(orderDetailSchema), "Updated"),
    ...authErrorResponses,
  },
});
