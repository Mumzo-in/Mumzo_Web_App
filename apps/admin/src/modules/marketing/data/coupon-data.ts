/** Coupons — api-plan §15f. */

export type CouponType = "flat" | "pct";

export type AdminCoupon = {
  id: string;
  code: string;
  type: CouponType;
  /** Rupees when `flat`, percent when `pct`. */
  value: number;
  minAmt: number;
  /** Max discount on a percentage coupon; null when uncapped. */
  cap: number | null;
  categorySlug: string | null;
  expiresAt: string;
  maxUses: number | null;
  usedCount: number;
  isActive: boolean;
  firstOrderOnly: boolean;
};

export const coupons: AdminCoupon[] = [
  {
    id: "cpn_001",
    code: "MUMZO100",
    type: "flat",
    value: 100,
    minAmt: 499,
    cap: null,
    categorySlug: null,
    expiresAt: "2026-09-30T23:59:59.000Z",
    maxUses: 5000,
    usedCount: 1842,
    isActive: true,
    firstOrderOnly: false,
  },
  {
    id: "cpn_002",
    code: "FIRSTBABY",
    type: "pct",
    value: 20,
    minAmt: 299,
    cap: 250,
    categorySlug: null,
    expiresAt: "2026-12-31T23:59:59.000Z",
    maxUses: null,
    usedCount: 934,
    isActive: true,
    firstOrderOnly: true,
  },
  {
    id: "cpn_003",
    code: "DIAPER15",
    type: "pct",
    value: 15,
    minAmt: 599,
    cap: 200,
    categorySlug: "diapering",
    expiresAt: "2026-08-15T23:59:59.000Z",
    maxUses: 2000,
    usedCount: 1987,
    isActive: true,
    firstOrderOnly: false,
  },
  {
    id: "cpn_004",
    code: "MONSOON50",
    type: "flat",
    value: 50,
    minAmt: 249,
    cap: null,
    categorySlug: null,
    expiresAt: "2026-06-30T23:59:59.000Z",
    maxUses: 3000,
    usedCount: 2440,
    isActive: false,
    firstOrderOnly: false,
  },
  {
    id: "cpn_005",
    code: "MOMCARE25",
    type: "pct",
    value: 25,
    minAmt: 799,
    cap: 400,
    categorySlug: "mom-care",
    expiresAt: "2026-10-31T23:59:59.000Z",
    maxUses: 1000,
    usedCount: 112,
    isActive: true,
    firstOrderOnly: false,
  },
];

export function findCoupon(id: string): AdminCoupon | undefined {
  return coupons.find((coupon) => coupon.id === id);
}

export function isExpired(coupon: AdminCoupon, now = new Date()): boolean {
  return new Date(coupon.expiresAt).getTime() < now.getTime();
}

export function isExhausted(coupon: AdminCoupon): boolean {
  return coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses;
}

/**
 * A coupon can be live yet unusable — expired or fully redeemed. Operators
 * need that distinction, so this is derived rather than read off `isActive`.
 */
export function couponState(coupon: AdminCoupon): {
  label: string;
  tint: string;
} {
  if (!coupon.isActive) {
    return { label: "Disabled", tint: "bg-secondary text-muted-foreground" };
  }
  if (isExpired(coupon)) {
    return { label: "Expired", tint: "bg-destructive/10 text-destructive" };
  }
  if (isExhausted(coupon)) {
    return { label: "Exhausted", tint: "bg-accent text-accent-foreground" };
  }
  return { label: "Live", tint: "bg-sage text-ink" };
}
