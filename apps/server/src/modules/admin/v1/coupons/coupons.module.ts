import { createRouter, requirePermission } from "@/core";
import {
  createRouteDef,
  deleteRouteDef,
  getRoute,
  listRoute,
  updateRouteDef,
  usageRoute,
} from "./coupons.routes";
import {
  createCoupon,
  deleteCoupon,
  getCoupon,
  getCouponUsage,
  listCoupons,
  updateCoupon,
} from "./coupons.service";

/** Coupon directory. Every route is guarded on `coupon:*`. */

const app = createRouter();

app.use("/*", requirePermission("coupon", "read"));
app.post("/", requirePermission("coupon", "create"));
app.patch("/:id", requirePermission("coupon", "update"));
app.delete("/:id", requirePermission("coupon", "delete"));

const coupons = app
  .openapi(listRoute, async (c) => {
    const query = c.req.valid("query");
    const { data, meta } = await listCoupons(query);
    return c.json({ success: true as const, data: { data, meta } }, 200);
  })
  .openapi(usageRoute, async (c) => {
    const data = await getCouponUsage(c.req.valid("param").id);
    return c.json({ success: true as const, data }, 200);
  })
  .openapi(getRoute, async (c) => {
    const coupon = await getCoupon(c.req.valid("param").id);
    return c.json({ success: true as const, data: coupon }, 200);
  })
  .openapi(createRouteDef, async (c) => {
    const id = await createCoupon(c.req.valid("json"));
    return c.json({ success: true as const, data: { id } }, 201);
  })
  .openapi(updateRouteDef, async (c) => {
    await updateCoupon(c.req.valid("param").id, c.req.valid("json"));
    return c.json({ success: true as const, data: { ok: true as const } }, 200);
  })
  .openapi(deleteRouteDef, async (c) => {
    await deleteCoupon(c.req.valid("param").id);
    return c.json({ success: true as const, data: { ok: true as const } }, 200);
  });

export default coupons;
