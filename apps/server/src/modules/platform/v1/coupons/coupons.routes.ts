import { createRoute } from "@hono/zod-openapi";

import { commonErrorResponses, jsonContent, successSchema } from "@/core";
import {
  validateCouponResultSchema,
  validateCouponSchema,
} from "@/modules/admin/v1/coupons/coupons.schema";

const TAG = "Platform | Cart";

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
