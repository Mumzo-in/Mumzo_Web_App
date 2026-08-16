import { createRoute } from "@hono/zod-openapi";

import {
  commonErrorResponses,
  jsonContent,
  paginatedSchema,
  successSchema,
} from "@/core";
import {
  cancelOrderSchema,
  listOrdersQuerySchema,
  orderDetailSchema,
  orderIdParamSchema,
  orderSavingsSchema,
  orderSummarySchema,
  placeOrderSchema,
} from "./orders.schema";

const TAG = "Platform | Orders";

export const placeOrderRoute = createRoute({
  method: "post",
  path: "/",
  tags: [TAG],
  summary: "Place an order from the current cart (COD)",
  request: {
    body: { content: { "application/json": { schema: placeOrderSchema } } },
  },
  responses: {
    201: jsonContent(successSchema(orderDetailSchema), "Order placed"),
    ...commonErrorResponses,
  },
});

export const orderSavingsRoute = createRoute({
  method: "get",
  path: "/savings",
  tags: [TAG],
  summary: "Lifetime total saved via coupons across every past order",
  responses: {
    200: jsonContent(successSchema(orderSavingsSchema), "Savings"),
    ...commonErrorResponses,
  },
});

export const listOrdersRoute = createRoute({
  method: "get",
  path: "/",
  tags: [TAG],
  summary: "List the signed-in customer's orders",
  request: { query: listOrdersQuerySchema },
  responses: {
    200: jsonContent(paginatedSchema(orderSummarySchema), "Orders"),
    ...commonErrorResponses,
  },
});

export const getOrderRoute = createRoute({
  method: "get",
  path: "/{id}",
  tags: [TAG],
  summary: "Order detail + status timeline",
  request: { params: orderIdParamSchema },
  responses: {
    200: jsonContent(successSchema(orderDetailSchema), "Order detail"),
    ...commonErrorResponses,
  },
});

export const cancelOrderRoute = createRoute({
  method: "post",
  path: "/{id}/cancel",
  tags: [TAG],
  summary: "Cancel an order (only while pending_payment/confirmed)",
  request: {
    params: orderIdParamSchema,
    body: { content: { "application/json": { schema: cancelOrderSchema } } },
  },
  responses: {
    200: jsonContent(successSchema(orderDetailSchema), "Cancelled"),
    ...commonErrorResponses,
  },
});
