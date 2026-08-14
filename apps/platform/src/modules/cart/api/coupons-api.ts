import { apiRequest } from "@/core/api/client";

export interface PublicCoupon {
  code: string;
  description: string | null;
  type: "flat" | "pct";
  value: number;
  cap: number | null;
  minAmt: number;
}

export function listPublicCoupons(): Promise<PublicCoupon[]> {
  return apiRequest<PublicCoupon[]>("/coupons");
}

export interface MyAssignedCoupon {
  id: string;
  code: string;
  description: string | null;
  type: "flat" | "pct";
  discountAmount: number;
  minAmt: number;
  status: "active" | "used" | "expired" | "revoked";
  expiresAt: string;
  /** The friend who referred this user, when this coupon is their referral
   * welcome reward — null for any other assigned coupon. */
  referrerName: string | null;
}

/** Any coupon assigned to the signed-in user — covers the referee's
 * first-order welcome coupon and any other manually-assigned marketing
 * coupon. Shared by the cart's coupon picker and the referrals page. */
export function listMyAssignedCoupons(): Promise<MyAssignedCoupon[]> {
  return apiRequest<MyAssignedCoupon[]>("/coupons/me");
}
