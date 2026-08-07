import { createRoute, z } from "@hono/zod-openapi";

import {
  authErrorResponses,
  jsonContent,
  paginatedSchema,
  successSchema,
} from "@/core";
import {
  couponIdParamSchema,
  couponSchema,
  createCouponSchema,
  listCouponsQuerySchema,
  updateCouponSchema,
  usageSchema,
} from "./coupons.schema";

const TAG = "Admin | Finance";

export const listRoute = createRoute({
  method: "get",
  path: "/",
  tags: [TAG],
  summary: "List coupons",
  security: [{ cookieAuth: [] }],
  request: { query: listCouponsQuerySchema },
  responses: {
    200: jsonContent(paginatedSchema(couponSchema), "Page of coupons"),
    ...authErrorResponses,
  },
});

export const getRoute = createRoute({
  method: "get",
  path: "/{id}",
  tags: [TAG],
  summary: "Get a coupon",
  security: [{ cookieAuth: [] }],
  request: { params: couponIdParamSchema },
  responses: {
    200: jsonContent(successSchema(couponSchema), "The coupon"),
    ...authErrorResponses,
  },
});

export const createRouteDef = createRoute({
  method: "post",
  path: "/",
  tags: [TAG],
  summary: "Create a coupon",
  security: [{ cookieAuth: [] }],
  request: {
    body: { content: { "application/json": { schema: createCouponSchema } } },
  },
  responses: {
    201: jsonContent(successSchema(z.object({ id: z.string() })), "Created"),
    ...authErrorResponses,
  },
});

export const updateRouteDef = createRoute({
  method: "patch",
  path: "/{id}",
  tags: [TAG],
  summary: "Update a coupon",
  security: [{ cookieAuth: [] }],
  request: {
    params: couponIdParamSchema,
    body: { content: { "application/json": { schema: updateCouponSchema } } },
  },
  responses: {
    200: jsonContent(
      successSchema(z.object({ ok: z.literal(true) })),
      "Updated",
    ),
    ...authErrorResponses,
  },
});

export const deleteRouteDef = createRoute({
  method: "delete",
  path: "/{id}",
  tags: [TAG],
  summary: "Deactivate a coupon",
  security: [{ cookieAuth: [] }],
  request: { params: couponIdParamSchema },
  responses: {
    200: jsonContent(
      successSchema(z.object({ ok: z.literal(true) })),
      "Deactivated",
    ),
    ...authErrorResponses,
  },
});

export const usageRoute = createRoute({
  method: "get",
  path: "/{id}/usage",
  tags: [TAG],
  summary: "Get coupon usage stats",
  security: [{ cookieAuth: [] }],
  request: { params: couponIdParamSchema },
  responses: {
    200: jsonContent(successSchema(z.array(usageSchema)), "Coupon redemptions"),
    ...authErrorResponses,
  },
});
