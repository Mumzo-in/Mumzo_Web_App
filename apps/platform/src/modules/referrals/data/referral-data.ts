/**
 * Referral programme — tier ladder + the customer's own progress.
 *
 * Intentionally plain, serializable data so the SuperAdmin can drive the tiers,
 * rewards, and linked offers from the backend later (`/admin` → referrals)
 * without touching this UI. Until then these are mock defaults.
 *
 * Tiers unlock on **successful referral count** — a friend who joins and places
 * a first delivered order. "Refer 1 → ₹150, refer 5 → ₹1000", and so on.
 */

export type RewardKind = "credit" | "percent" | "free_delivery";

export type ReferralReward =
  | { kind: "credit"; amount: number } // ₹ wallet credit
  | { kind: "percent"; value: number; cap: number | null } // % off, optional cap
  | { kind: "free_delivery"; count: number }; // N free deliveries

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

/** An invited friend and where they are in the funnel. */
export type ReferralInviteStatus = "invited" | "joined" | "rewarded";

export type ReferralInvite = {
  id: string;
  name: string;
  status: ReferralInviteStatus;
  /** Human-readable reward state. */
  note: string;
};

export type ReferralProgram = {
  /** The signed-in customer's own code. */
  code: string;
  /** Successful referrals so far — drives tier progress. */
  successfulReferrals: number;
  tiers: ReferralTier[];
  offers: ReferralOffer[];
  invites: ReferralInvite[];
};

export const INVITE_STATUS_META: Record<
  ReferralInviteStatus,
  { label: string; tint: string }
> = {
  invited: { label: "Invited", tint: "bg-accent/50 text-ink" },
  joined: { label: "Joined", tint: "bg-cream text-ink" },
  rewarded: { label: "Rewarded", tint: "bg-sage/60 text-ink" },
};

/** Mock programme for the signed-in user. Backend-driven later. */
export const referralProgram: ReferralProgram = {
  code: "ANANYA150",
  successfulReferrals: 3,
  tiers: [
    {
      id: "t1",
      name: "First invite",
      threshold: 1,
      reward: { kind: "credit", amount: 150 },
      blurb: "₹150 wallet credit on your friend's first delivered order.",
    },
    {
      id: "t2",
      name: "Getting the word out",
      threshold: 3,
      reward: { kind: "credit", amount: 500 },
      blurb: "₹500 credit once three friends have ordered.",
    },
    {
      id: "t3",
      name: "Mumzo champion",
      threshold: 5,
      reward: { kind: "credit", amount: 1000 },
      blurb: "₹1,000 credit — you're a proper Mumzo champion now.",
    },
    {
      id: "t4",
      name: "Community builder",
      threshold: 10,
      reward: { kind: "free_delivery", count: 12 },
      blurb: "A year of free deliveries — 12 on the house.",
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
  invites: [
    { id: "i1", name: "Meera", status: "rewarded", note: "₹150 credited" },
    { id: "i2", name: "Kavya", status: "joined", note: "Order in progress" },
    { id: "i3", name: "Ritu", status: "rewarded", note: "₹150 credited" },
    { id: "i4", name: "Divya", status: "invited", note: "Pending first order" },
  ],
};

/** Formats a reward for display. */
export function describeReward(reward: ReferralReward): string {
  switch (reward.kind) {
    case "credit":
      return `₹${reward.amount} credit`;
    case "percent":
      return reward.cap
        ? `${reward.value}% off (up to ₹${reward.cap})`
        : `${reward.value}% off`;
    case "free_delivery":
      return `${reward.count} free deliveries`;
  }
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
