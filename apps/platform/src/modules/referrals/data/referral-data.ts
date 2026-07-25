/**
 * Referral programme — tier ladder, coupons, and the customer's invite feed.
 *
 * Intentionally plain, serializable data so the SuperAdmin can drive the tiers,
 * rewards, and linked offers from the backend later (`/admin` → referrals)
 * without touching this UI. Until then these are mock defaults.
 *
 * Tiers unlock on **successful referral count** — a friend who joins, places a
 * first order, and clears the return window. Each milestone reached issues a
 * single-use coupon code, not wallet credit.
 */

/** Referral rewards are always coupon codes for a fixed discount amount. */
export type ReferralReward = {
  kind: "coupon";
  /** Discount amount in whole rupees. */
  amount: number;
};

/** One rung of the ladder: reach `threshold` successful referrals → `reward`. */
export type ReferralTier = {
  id: string;
  name: string;
  /** Successful referrals required to unlock this tier. */
  threshold: number;
  reward: ReferralReward;
  /** One-line pitch shown under the tier name. */
  blurb: string;
};

/** A referral-linked offer — a code the referrer can also hand out. */
export type ReferralOffer = {
  id: string;
  code: string;
  headline: string;
  detail: string;
  /** Whole rupees off, or a percentage — mirrors the storefront Offer shape. */
  discount?: number;
  pct?: number;
  minAmt?: number;
};

/** A coupon issued to the referrer for reaching a tier milestone. */
export type ReferralCoupon = {
  id: string;
  /** e.g. "REF150-8X92K" */
  code: string;
  discountAmount: number;
  status: "active" | "used" | "expired" | "revoked";
  /** ISO date */
  expiresAt: string;
  usedAt?: string;
};

/** The 3-stage invite funnel a friend moves through, plus terminal states. */
export type ReferralInviteStatus =
  | "link_shared"
  | "signed_up"
  | "order_placed"
  | "completed"
  | "returned";

/** Ordered funnel stages used to render the invite tracker's stage dots. */
export const INVITE_FUNNEL_STAGES: ReferralInviteStatus[] = [
  "link_shared",
  "signed_up",
  "order_placed",
];

export type ReferralInvite = {
  id: string;
  name: string;
  status: ReferralInviteStatus;
};

export type ReferralProgram = {
  /** The signed-in customer's own code. */
  code: string;
  /** Successful referrals so far — drives tier progress. */
  successfulReferrals: number;
  tiers: ReferralTier[];
  offers: ReferralOffer[];
  coupons: ReferralCoupon[];
  invites: ReferralInvite[];
};

export const INVITE_STATUS_META: Record<
  ReferralInviteStatus,
  { label: string; tint: string }
> = {
  link_shared: { label: "Link Shared", tint: "bg-accent/50 text-ink" },
  signed_up: { label: "Signed Up", tint: "bg-cream text-ink" },
  order_placed: { label: "Order Placed", tint: "bg-sage/60 text-ink" },
  completed: { label: "Completed", tint: "bg-primary/10 text-ink" },
  returned: {
    label: "Returned",
    tint: "bg-destructive/10 text-destructive",
  },
};

export const COUPON_STATUS_META: Record<
  ReferralCoupon["status"],
  {
    label: string;
    variant: "default" | "secondary" | "outline" | "destructive";
  }
> = {
  active: { label: "Active", variant: "default" },
  used: { label: "Used", variant: "secondary" },
  expired: { label: "Expired", variant: "outline" },
  revoked: { label: "Revoked", variant: "destructive" },
};

/** FAQ entries for the referrals page accordion. */
export const referralFaqs: { id: string; question: string; answer: string }[] =
  [
    {
      id: "f1",
      question: "How does the referral programme work?",
      answer:
        "Share your code or link with other parents. When a friend signs up and places their first order, they're tracked through your invite feed. Once their order clears the 7-day return window, it counts as a successful referral.",
    },
    {
      id: "f2",
      question: "When do I get my coupon?",
      answer:
        "Coupons are issued after your friend's order clears the return window — not on delivery. This keeps rewards fair for both of you. Reaching a new milestone (1, 3, 5, or 10 referrals) unlocks that tier's coupon automatically.",
    },
    {
      id: "f3",
      question: "What happens if my friend returns their order?",
      answer:
        "If the order is returned or fully refunded within the return window, that referral doesn't count. If a coupon was already issued for it, it's revoked.",
    },
    {
      id: "f4",
      question: "Can I use multiple referral coupons on one order?",
      answer:
        "No — referral coupons are single-use and can't be stacked with other referral coupons on the same order.",
    },
    {
      id: "f5",
      question: "Do referral coupons expire?",
      answer:
        "Yes, each coupon is valid for 90 days from the date it's issued. Check the expiry date on each coupon in your list.",
    },
  ];

/** Mock programme for the signed-in user. Backend-driven later. */
export const referralProgram: ReferralProgram = {
  code: "ANANYA150",
  successfulReferrals: 3,
  tiers: [
    {
      id: "t1",
      name: "First invite",
      threshold: 1,
      reward: { kind: "coupon", amount: 150 },
      blurb: "₹150 off your next order.",
    },
    {
      id: "t2",
      name: "Getting the word out",
      threshold: 3,
      reward: { kind: "coupon", amount: 400 },
      blurb: "₹400 off — three friends onboard.",
    },
    {
      id: "t3",
      name: "Mumzo champion",
      threshold: 5,
      reward: { kind: "coupon", amount: 600 },
      blurb: "₹600 off — you're a proper champion now.",
    },
    {
      id: "t4",
      name: "Community builder",
      threshold: 10,
      reward: { kind: "coupon", amount: 2000 },
      blurb: "₹2,000 off — community builder unlocked.",
    },
  ],
  offers: [
    {
      id: "o1",
      code: "FRIEND150",
      headline: "₹150 off for your friend",
      detail: "Your friend's first order, no minimum.",
      discount: 150,
    },
    {
      id: "o2",
      code: "DUO20",
      headline: "20% off when you both shop",
      detail: "Up to ₹300 off, on orders above ₹599.",
      pct: 20,
      minAmt: 599,
    },
  ],
  coupons: [
    {
      id: "c1",
      code: "REF150-8X92K",
      discountAmount: 150,
      status: "used",
      expiresAt: "2026-08-12",
      usedAt: "2026-06-02",
    },
    {
      id: "c2",
      code: "REF400-K2M9Q",
      discountAmount: 400,
      status: "active",
      expiresAt: "2026-10-01",
    },
  ],
  invites: [
    { id: "i1", name: "Meera", status: "completed" },
    { id: "i2", name: "Kavya", status: "signed_up" },
    { id: "i3", name: "Ritu", status: "completed" },
    { id: "i4", name: "Divya", status: "link_shared" },
    { id: "i5", name: "Priya", status: "returned" },
  ],
};

/**
 * Personalizes a referral code from the signed-in user's name — "Bikram" →
 * "BIKRAM150". Falls back to a generic prefix when there's no name yet
 * (mid-onboarding, or a guest preview).
 */
export function deriveReferralCode(
  name: string | null | undefined,
  suffix = "150",
): string {
  const firstName = name?.trim().split(/\s+/)[0] ?? "";
  const cleaned = firstName.replace(/[^a-zA-Z]/g, "").toUpperCase();
  return `${cleaned || "MUMZO"}${suffix}`;
}

/** The highest tier the user has already unlocked, or null if none yet. */
export function currentTier(program: ReferralProgram): ReferralTier | null {
  const unlocked = program.tiers.filter(
    (tier) => program.successfulReferrals >= tier.threshold,
  );
  return unlocked.at(-1) ?? null;
}

/** The next tier still to reach, or null when the top is unlocked. */
export function nextTier(program: ReferralProgram): ReferralTier | null {
  return (
    program.tiers.find(
      (tier) => program.successfulReferrals < tier.threshold,
    ) ?? null
  );
}

/** Referrals still needed to reach the next tier (0 when maxed out). */
export function referralsToNext(program: ReferralProgram): number {
  const next = nextTier(program);
  return next ? next.threshold - program.successfulReferrals : 0;
}

/** Index (0-based) of an invite's status within the 3-stage funnel, or -1 for terminal states not in the funnel proper (returned counts as having reached order_placed). */
export function inviteStageIndex(status: ReferralInviteStatus): number {
  if (status === "completed" || status === "returned") {
    return INVITE_FUNNEL_STAGES.length - 1;
  }
  return INVITE_FUNNEL_STAGES.indexOf(status);
}
