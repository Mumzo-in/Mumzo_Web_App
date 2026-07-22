import { createRouter } from "@/core";
import { validateCoupon } from "@/modules/admin/v1/coupons/coupons.service";
import { validateRoute } from "./coupons.routes";

/**
 * Public coupon validation. Anonymous — mounted under `optionalAuth` in
 * `platform/v1/index.ts`, not gated behind it. Shares `validateCoupon`
 * with the admin module rather than duplicating the discount math.
 */

const app = createRouter();

const coupons = app.openapi(validateRoute, async (c) => {
  const result = await validateCoupon(c.req.valid("json"));
  return c.json({ success: true as const, data: result }, 200);
});

export default coupons;
