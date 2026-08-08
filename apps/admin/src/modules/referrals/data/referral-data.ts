/**
 * Referral programme — the SuperAdmin management surface.
 *
 * Mirrors the storefront's coupon-based model
 * (apps/platform/src/modules/referrals/data/referral-data.ts) and
 * docs/platform/referral_system_architecture.md: reaching a referral-count
 * milestone (1/3/5/10) issues the referrer a single-use coupon, not wallet
 * credit. Staff configure the tier ladder and programme rules here; the
 * storefront reads them. Mock data until the admin API exists (§15f has no
 * spec yet for this module).
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
  /** Days after delivery before a completed order can no longer be returned. */
  returnWindowDays: number;
  /** Days a coupon stays redeemable after being issued. */
  couponValidityDays: number;
  /** Max coupons a single referrer can earn per month. 0 = no cap. */
  monthlyCapPerUser: number;
  /** Reward the referred friend gets on their first order, in whole rupees. */
  refereeReward: number;
  /** Block referrer/referee sharing phone, email, or device fingerprint. */
  selfReferralBlock: boolean;
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

/** A coupon issued to a referrer for reaching a tier milestone. */
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

/** Config the admin edits; drives what the storefront shows. */
export const referralConfig: ReferralProgramConfig = {
  isEnabled: true,
  codePattern: "{NAME}{RANDOM3}",
  rules: {
    returnWindowDays: 7,
    couponValidityDays: 90,
    monthlyCapPerUser: 5,
    refereeReward: 150,
    selfReferralBlock: true,
  },
  tiers: [
    {
      id: "t1",
      name: "First invite",
      threshold: 1,
      couponAmount: 150,
      membersInTier: 1840,
      isActive: true,
    },
    {
      id: "t2",
      name: "Getting the word out",
      threshold: 3,
      couponAmount: 400,
      membersInTier: 412,
      isActive: true,
    },
    {
      id: "t3",
      name: "Mumzo champion",
      threshold: 5,
      couponAmount: 600,
      membersInTier: 96,
      isActive: true,
    },
    {
      id: "t4",
      name: "Community builder",
      threshold: 10,
      couponAmount: 2000,
      membersInTier: 18,
      isActive: false,
    },
  ],
};

export const referralStats: ReferralStats = {
  totalReferrers: 2366,
  successfulReferrals: 4880,
  pendingReferrals: 517,
  rewardsPaidThisMonth: 412_500,
  funnel: {
    linkShared: 8210,
    signedUp: 5920,
    orderPlaced: 4880,
    completed: 4363,
  },
};

export const referralActivity: ReferralActivityEvent[] = [
  {
    id: "a1",
    referrerName: "Meera",
    message: "unlocked Tier 2 (₹400 coupon)",
    at: "2026-08-07T10:20:00.000Z",
  },
  {
    id: "a2",
    referrerName: "Priya",
    message: "referral returned — coupon revoked",
    at: "2026-08-06T15:40:00.000Z",
  },
  {
    id: "a3",
    referrerName: "Divya",
    message: "shared referral link",
    at: "2026-08-06T09:05:00.000Z",
  },
  {
    id: "a4",
    referrerName: "Ananya",
    message: "unlocked Tier 1 (₹150 coupon)",
    at: "2026-08-05T18:12:00.000Z",
  },
];

export const referralParticipants: ReferralParticipant[] = [
  {
    id: "p1",
    name: "Ananya Rao",
    code: "ANANYA150",
    totalReferred: 6,
    successfulReferrals: 3,
    currentTierName: "Getting the word out",
    couponsIssued: 2,
    joinedAt: "2026-06-12",
  },
  {
    id: "p2",
    name: "Bikram Sarmah",
    code: "BIKRAM150",
    totalReferred: 2,
    successfulReferrals: 1,
    currentTierName: "First invite",
    couponsIssued: 1,
    joinedAt: "2026-07-03",
  },
  {
    id: "p3",
    name: "Meera Nair",
    code: "MEERA150",
    totalReferred: 5,
    successfulReferrals: 5,
    currentTierName: "Mumzo champion",
    couponsIssued: 3,
    joinedAt: "2026-05-21",
  },
  {
    id: "p4",
    name: "Kavya Iyer",
    code: "KAVYA150",
    totalReferred: 1,
    successfulReferrals: 0,
    currentTierName: null,
    couponsIssued: 0,
    joinedAt: "2026-07-28",
  },
];

export const referralInvitesByParticipant: Record<string, ReferralInvite[]> = {
  p1: [
    {
      id: "i1",
      refereeName: "Ritu",
      status: "completed",
      updatedAt: "2026-07-01",
    },
    {
      id: "i2",
      refereeName: "Kavya",
      status: "order_placed",
      updatedAt: "2026-07-20",
    },
    {
      id: "i3",
      refereeName: "Divya",
      status: "signed_up",
      updatedAt: "2026-08-01",
    },
    {
      id: "i4",
      refereeName: "Sana",
      status: "link_shared",
      updatedAt: "2026-08-05",
    },
    {
      id: "i5",
      refereeName: "Priya",
      status: "returned",
      updatedAt: "2026-07-15",
    },
    {
      id: "i6",
      refereeName: "Neha",
      status: "completed",
      updatedAt: "2026-06-28",
    },
  ],
  p2: [
    {
      id: "i7",
      refereeName: "Farah",
      status: "completed",
      updatedAt: "2026-07-10",
    },
    {
      id: "i8",
      refereeName: "Ishaan",
      status: "link_shared",
      updatedAt: "2026-08-02",
    },
  ],
  p3: [
    {
      id: "i9",
      refereeName: "Anu",
      status: "completed",
      updatedAt: "2026-06-01",
    },
    {
      id: "i10",
      refereeName: "Zoya",
      status: "completed",
      updatedAt: "2026-06-10",
    },
    {
      id: "i11",
      refereeName: "Ira",
      status: "completed",
      updatedAt: "2026-06-18",
    },
    {
      id: "i12",
      refereeName: "Tara",
      status: "completed",
      updatedAt: "2026-06-25",
    },
    {
      id: "i13",
      refereeName: "Mira",
      status: "completed",
      updatedAt: "2026-07-02",
    },
  ],
  p4: [
    {
      id: "i14",
      refereeName: "Om",
      status: "link_shared",
      updatedAt: "2026-07-29",
    },
  ],
};

export const referralCoupons: ReferralCoupon[] = [
  {
    id: "c1",
    code: "REF150-8X92K",
    referrerName: "Ananya Rao",
    amount: 150,
    status: "used",
    issuedAt: "2026-06-02",
    expiresAt: "2026-08-31",
    usedInOrderId: "ORD-4471",
  },
  {
    id: "c2",
    code: "REF400-K2M9Q",
    referrerName: "Ananya Rao",
    amount: 400,
    status: "active",
    issuedAt: "2026-07-05",
    expiresAt: "2026-10-03",
    usedInOrderId: null,
  },
  {
    id: "c3",
    code: "REF150-7Y31Z",
    referrerName: "Bikram Sarmah",
    amount: 150,
    status: "active",
    issuedAt: "2026-07-15",
    expiresAt: "2026-10-13",
    usedInOrderId: null,
  },
  {
    id: "c4",
    code: "REF600-M4P8R",
    referrerName: "Meera Nair",
    amount: 600,
    status: "expired",
    issuedAt: "2026-04-01",
    expiresAt: "2026-06-30",
    usedInOrderId: null,
  },
  {
    id: "c5",
    code: "REF150-QW2E9",
    referrerName: "Priya Menon",
    amount: 150,
    status: "revoked",
    issuedAt: "2026-07-10",
    expiresAt: "2026-10-08",
    usedInOrderId: null,
  },
];

/** The next tier still to reach for a given successful-referral count. */
export function nextTier(
  tiers: ReferralTier[],
  successfulReferrals: number,
): ReferralTier | null {
  return tiers.find((tier) => successfulReferrals < tier.threshold) ?? null;
}
