import type { Coupon } from "../api/coupons-api";

export const COUPON_TYPE_META: Record<Coupon["type"], { label: string }> = {
  flat: { label: "Flat" },
  pct: { label: "Percentage" },
};

export const PRODUCT_SCOPE_OPTIONS: {
  value: Coupon["productScope"];
  label: string;
}[] = [
  { value: "all", label: "All products" },
  { value: "specific", label: "Specific products" },
];

export const VISIBILITY_OPTIONS: {
  value: Coupon["visibility"];
  label: string;
}[] = [
  { value: "public", label: "Public" },
  { value: "assigned", label: "Assigned customers" },
];

export function isExpired(coupon: Coupon, now = new Date()): boolean {
  return new Date(coupon.expiresAt).getTime() < now.getTime();
}

export function isExhausted(coupon: Coupon): boolean {
  return coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses;
}

/**
 * A coupon can be live yet unusable — expired or fully redeemed. Operators
 * need that distinction, so this is derived rather than read off `isActive`.
 */
export function couponState(coupon: Coupon): {
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
