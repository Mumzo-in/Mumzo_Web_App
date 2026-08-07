import { db } from "@mumzo/db";
import { coupon } from "@mumzo/db/schema/marketing";
import { and, eq, gt, isNull, lte, or } from "drizzle-orm";
import { createRouter } from "@/core";
import { toWholeRupees } from "@/lib/money";
import { validateCoupon } from "@/modules/admin/v1/coupons/coupons.service";
import { listPublicRoute, validateRoute } from "./coupons.routes";

/**
 * Public coupons and validation. Anonymous.
 */

const app = createRouter();

app.openapi(listPublicRoute, async (c) => {
  const now = new Date();
  const rows = await db
    .select()
    .from(coupon)
    .where(
      and(
        eq(coupon.isActive, true),
        eq(coupon.isGlobal, true),
        gt(coupon.expiresAt, now),
        or(isNull(coupon.startsAt), lte(coupon.startsAt, now)),
      ),
    )
    .orderBy(coupon.priority);

  return c.json(
    {
      success: true as const,
      data: rows.map((r) => ({
        code: r.code,
        description: r.description,
        type: r.type as "flat" | "pct",
        value: r.type === "flat" ? toWholeRupees(r.value) : r.value,
        cap: r.cap === null ? null : toWholeRupees(r.cap),
        minAmt: toWholeRupees(r.minAmt),
      })),
    },
    200,
  );
});

app.openapi(validateRoute, async (c) => {
  const result = await validateCoupon(c.req.valid("json"));
  return c.json({ success: true as const, data: result }, 200);
});

export default app;
