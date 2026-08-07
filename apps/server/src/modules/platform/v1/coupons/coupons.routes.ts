import { createRoute, z } from "@hono/zod-openapi";

import { commonErrorResponses, jsonContent, successSchema } from "@/core";
import {
  validateCouponResultSchema,
  validateCouponSchema,
} from "@/modules/admin/v1/coupons/coupons.schema";

const TAG = "Platform | Cart";

export const publicCouponSchema = z
  .object({
    code: z.string(),
    description: z.string().nullable(),
    type: z.enum(["flat", "pct"]),
    value: z.number(),
    cap: z.number().nullable(),
    minAmt: z.number(),
  })
  .openapi("PublicCoupon");

export const listPublicRoute = createRoute({
  method: "get",
  path: "/",
  tags: [TAG],
  summary: "List active global coupons",
  responses: {
    200: jsonContent(
      successSchema(z.array(publicCouponSchema)),
      "Active global coupons",
    ),
    ...commonErrorResponses,
  },
});

export const validateRoute = createRoute({
  method: "post",
  path: "/validate",
  tags: [TAG],
  summary: "Validate a coupon code against a cart",
  request: {
    body: { content: { "application/json": { schema: validateCouponSchema } } },
  },
  responses: {
    200: jsonContent(
      successSchema(validateCouponResultSchema),
      "Discount preview",
    ),
    ...commonErrorResponses,
  },
});
