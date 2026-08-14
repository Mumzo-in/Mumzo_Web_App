import { db } from "@mumzo/db";
import { coupon } from "@mumzo/db/schema/marketing";
import { and, eq, gt, isNull, lte, or } from "drizzle-orm";
import { createRouter, requireAuth } from "@/core";
import { unauthorized } from "@/core/errors";
import { toWholeRupees } from "@/lib/money";
import { validateCoupon } from "@/modules/admin/v1/coupons/coupons.service";
import { listAssignedCouponsForUser } from "@/modules/platform/v1/referrals/referrals.repo";
import {
  listMyCouponsRoute,
  listPublicRoute,
  validateRoute,
} from "./coupons.routes";

/**
 * Public coupons and validation (anonymous), plus the signed-in customer's
 * assigned coupons (referral rewards and any other assigned coupon).
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

app.use("/me", requireAuth);

app.openapi(listMyCouponsRoute, async (c) => {
  const authUser = c.get("user");
  if (!authUser) {
    throw unauthorized();
  }

  const rows = await listAssignedCouponsForUser(authUser.id);
  const now = new Date();

  return c.json(
    {
      success: true as const,
      data: rows.map((row) => ({
        id: row.id,
        code: row.code,
        description: row.description,
        type: row.type as "flat" | "pct",
        discountAmount:
          row.type === "flat" ? toWholeRupees(row.value) : row.value,
        minAmt: toWholeRupees(row.minAmt),
        status: !row.isActive
          ? ("revoked" as const)
          : row.expiresAt < now
            ? ("expired" as const)
            : row.usedCount >= (row.maxUses ?? 1)
              ? ("used" as const)
              : ("active" as const),
        expiresAt: row.expiresAt.toISOString(),
        referrerName: row.referrerName,
      })),
    },
    200,
  );
});

export default app;
