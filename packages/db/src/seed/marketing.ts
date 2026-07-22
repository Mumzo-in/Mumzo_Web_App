import { inArray } from "drizzle-orm";
import { db } from "../index";
import { coupon } from "../schema/marketing";

/**
 * Seed coupons.
 *
 * Idempotent and non-destructive, matching `seedBrands`/`seedVendors` in
 * `./catalog.ts`: an existing row (by `code`) is left untouched, never
 * overwritten. Values are transcribed from the admin's former mock data
 * (`apps/admin/src/modules/marketing/data/coupon-data.ts`) so a freshly
 * seeded database renders identically to what the panel already showed
 * against mock data.
 */

type CouponSeed = {
  code: string;
  type: "flat" | "pct";
  value: number;
  minAmt: number;
  cap: number | null;
  categorySlug: string | null;
  expiresAt: Date;
  maxUses: number | null;
  usedCount: number;
  isActive: boolean;
  firstOrderOnly: boolean;
};

const COUPON_SEEDS: CouponSeed[] = [
  {
    code: "MUMZO100",
    type: "flat",
    value: 100,
    minAmt: 499,
    cap: null,
    categorySlug: null,
    expiresAt: new Date("2026-09-30T23:59:59.000Z"),
    maxUses: 5000,
    usedCount: 1842,
    isActive: true,
    firstOrderOnly: false,
  },
  {
    code: "FIRSTBABY",
    type: "pct",
    value: 20,
    minAmt: 299,
    cap: 250,
    categorySlug: null,
    expiresAt: new Date("2026-12-31T23:59:59.000Z"),
    maxUses: null,
    usedCount: 934,
    isActive: true,
    firstOrderOnly: true,
  },
  {
    code: "DIAPER15",
    type: "pct",
    value: 15,
    minAmt: 599,
    cap: 200,
    categorySlug: "diapers",
    expiresAt: new Date("2026-08-15T23:59:59.000Z"),
    maxUses: 2000,
    usedCount: 1987,
    isActive: true,
    firstOrderOnly: false,
  },
  {
    code: "MONSOON50",
    type: "flat",
    value: 50,
    minAmt: 249,
    cap: null,
    categorySlug: null,
    expiresAt: new Date("2026-06-30T23:59:59.000Z"),
    maxUses: 3000,
    usedCount: 2440,
    isActive: false,
    firstOrderOnly: false,
  },
  {
    code: "MOMCARE25",
    type: "pct",
    value: 25,
    minAmt: 799,
    cap: 400,
    categorySlug: "mom-care",
    expiresAt: new Date("2026-10-31T23:59:59.000Z"),
    maxUses: 1000,
    usedCount: 112,
    isActive: true,
    firstOrderOnly: false,
  },
];

export async function seedCoupons() {
  const codes = COUPON_SEEDS.map((seed) => seed.code);

  const existing = await db
    .select({ code: coupon.code })
    .from(coupon)
    .where(inArray(coupon.code, codes));

  const present = new Set(existing.map((row) => row.code));
  const missing = COUPON_SEEDS.filter((seed) => !present.has(seed.code));

  if (missing.length > 0) {
    await db.insert(coupon).values(missing.map((seed) => ({ ...seed })));
  }

  return {
    created: missing.length,
    skipped: COUPON_SEEDS.length - missing.length,
  };
}
