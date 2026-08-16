/**
 * Referral programme — the SuperAdmin management surface.
 *
 * Mirrors the storefront's coupon-based model
 * (apps/platform/src/modules/referrals/data/referral-data.ts) and
 * docs/platform/referral_system_architecture.md: reaching a referral-count
 * milestone issues the referrer a single-use coupon, not wallet credit.
 * Staff configure the tier ladder and programme rules here; the storefront
 * reads them. Types + display metadata only — the data itself is
 * DB-backed, served by `apps/server/.../admin/v1/referrals`.
 */

/** One rung of the ladder: reach `threshold` successful referrals → a coupon. */
export type ReferralTier = {
  id: string;
  name: string;
  /** Successful referrals required to unlock this tier. */
  threshold: number;
  /** Coupon face value in whole rupees. */
  couponAmount: number;
  /** How many customers currently sit in this tier — read-only stat. */
  membersInTier: number;
  isActive: boolean;
};

/** Programme-wide rules — the settlement engine's knobs. */
export type ReferralRules = {
  /** Hours after delivery before a completed order can no longer be returned. */
  returnWindowHours: number;
  /** Days a coupon stays redeemable — from claim time when `settleOnDelivery`
   * is on, from issuance otherwise. */
  couponValidityDays: number;
  /** Max coupons a single referrer can earn per month. 0 = no cap. */
  monthlyCapPerUser: number;
  /** Reward the referred friend gets on their first order, in whole rupees. */
  refereeReward: number;
  /** Block referrer/referee sharing phone, email, or device fingerprint. */
  selfReferralBlock: boolean;
  /** Settle a referral (tier count + coupon) as soon as the order is
   * delivered instead of waiting for the return window — the referrer must
   * still claim the coupon to start its validity clock. */
  settleOnDelivery: boolean;
};

export type ReferralProgramConfig = {
  /** Master switch for the whole programme. */
  isEnabled: boolean;
  /** How the referrer's code is generated for new users, e.g. "{NAME}{RANDOM3}". */
  codePattern: string;
  rules: ReferralRules;
  tiers: ReferralTier[];
};

export type ReferralStats = {
  totalReferrers: number;
  successfulReferrals: number;
  pendingReferrals: number;
  /** Rupees paid out (coupon face value) in issued coupons, this month. */
  rewardsPaidThisMonth: number;
  /** Invite funnel — cumulative, all-time. */
  funnel: {
    linkShared: number;
    signedUp: number;
    orderPlaced: number;
    completed: number;
  };
};

export type ReferralActivityEvent = {
  id: string;
  referrerName: string;
  /** e.g. "unlocked Tier 2", "order returned", "shared link" */
  message: string;
  at: string;
};

/** One referrer and their aggregate invite performance — the "who joined" list. */
export type ReferralParticipant = {
  id: string;
  name: string;
  code: string;
  /** Total friends who ever used this referrer's code (any funnel stage). */
  totalReferred: number;
  successfulReferrals: number;
  currentTierName: string | null;
  couponsIssued: number;
  joinedAt: string;
};

export type ReferralInviteStatus =
  | "link_shared"
  | "signed_up"
  | "order_placed"
  | "completed"
  | "returned";

/** One invited friend under a participant — the per-friend funnel detail. */
export type ReferralInvite = {
  id: string;
  refereeName: string;
  status: ReferralInviteStatus;
  updatedAt: string;
};

export type ReferralCouponStatus = "active" | "used" | "expired" | "revoked";

/** A coupon issued to a referrer for reaching a tier milestone. Usable
 * immediately upon issuance — there is no separate claim step. */
export type ReferralCoupon = {
  id: string;
  code: string;
  referrerName: string;
  amount: number;
  status: ReferralCouponStatus;
  issuedAt: string;
  expiresAt: string;
  usedInOrderId: string | null;
};

export const INVITE_STATUS_META: Record<
  ReferralInviteStatus,
  { label: string; tint: string }
> = {
  link_shared: { label: "Link Shared", tint: "bg-accent/50 text-ink" },
  signed_up: { label: "Signed Up", tint: "bg-secondary text-foreground" },
  order_placed: { label: "Order Placed", tint: "bg-sage text-ink" },
  completed: { label: "Completed", tint: "bg-primary/10 text-primary" },
  returned: {
    label: "Returned",
    tint: "bg-destructive/10 text-destructive",
  },
};

export const COUPON_STATUS_META: Record<
  ReferralCouponStatus,
  { label: string; tint: string }
> = {
  active: { label: "Active", tint: "bg-sage text-ink" },
  used: { label: "Used", tint: "bg-secondary text-foreground" },
  expired: { label: "Expired", tint: "bg-muted text-muted-foreground" },
  revoked: {
    label: "Revoked",
    tint: "bg-destructive/10 text-destructive",
  },
};

/** The next tier still to reach for a given successful-referral count. */
export function nextTier(
  tiers: ReferralTier[],
  successfulReferrals: number,
): ReferralTier | null {
  return tiers.find((tier) => successfulReferrals < tier.threshold) ?? null;
}
