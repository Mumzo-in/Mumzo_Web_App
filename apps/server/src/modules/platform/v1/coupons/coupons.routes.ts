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

export const myAssignedCouponSchema = z
  .object({
    id: z.string(),
    code: z.string(),
    description: z.string().nullable(),
    type: z.enum(["flat", "pct"]),
    discountAmount: z.number(),
    minAmt: z.number(),
    status: z.enum(["active", "used", "expired", "revoked"]),
    expiresAt: z.string(),
    /** The friend who referred this user, when this coupon is their
     * referral welcome reward — null for any other assigned coupon. */
    referrerName: z.string().nullable(),
  })
  .openapi("MyAssignedCoupon");

export const listMyCouponsRoute = createRoute({
  method: "get",
  path: "/me",
  tags: [TAG],
  summary: "Coupons assigned to the signed-in customer",
  security: [{ cookieAuth: [] }],
  responses: {
    200: jsonContent(
      successSchema(z.array(myAssignedCouponSchema)),
      "Your assigned coupons",
    ),
    ...commonErrorResponses,
  },
});
