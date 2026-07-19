/**
 * Referral programme — the SuperAdmin management view.
 *
 * This is the config side: staff set the tier ladder, the referral reward
 * codes, and the linked offers here; the storefront reads them. Tiers unlock
 * on **successful referral count** (a friend who joins and places a first
 * delivered order): "refer 1 → ₹150, refer 5 → ₹1000".
 *
 * Mock data until the admin API (needs a spec — no §15 endpoint exists yet).
 */

export type RewardKind = "credit" | "percent" | "free_delivery";

export type ReferralReward =
  | { kind: "credit"; amount: number }
  | { kind: "percent"; value: number; cap: number | null }
  | { kind: "free_delivery"; count: number };

export type ReferralTier = {
  id: string;
  name: string;
  /** Successful referrals required to unlock this tier. */
  threshold: number;
  reward: ReferralReward;
  /** How many customers currently sit in this tier — read-only stat. */
  membersInTier: number;
  isActive: boolean;
};

export type ReferralCode = {
  id: string;
  code: string;
  /** Whole rupees off the referred friend's first order. */
  refereeReward: number;
  usedCount: number;
  isActive: boolean;
};

export type ReferralProgramConfig = {
  /** Master switch for the whole programme. */
  isEnabled: boolean;
  /** How the referrer's code is generated for new users. */
  codePattern: string;
  tiers: ReferralTier[];
  codes: ReferralCode[];
};

export type ReferralStats = {
  totalReferrers: number;
  successfulReferrals: number;
  pendingReferrals: number;
  /** Rupees paid out in referral rewards, this month. */
  rewardsPaidThisMonth: number;
};

export const REWARD_KIND_LABELS: Record<RewardKind, string> = {
  credit: "Wallet credit",
  percent: "Percentage off",
  free_delivery: "Free deliveries",
};

/** Config the admin edits; drives what the storefront shows. */
export const referralConfig: ReferralProgramConfig = {
  isEnabled: true,
  codePattern: "{NAME}{RANDOM3}",
  tiers: [
    {
      id: "t1",
      name: "First invite",
      threshold: 1,
      reward: { kind: "credit", amount: 150 },
      membersInTier: 1840,
      isActive: true,
    },
    {
      id: "t2",
      name: "Getting the word out",
      threshold: 3,
      reward: { kind: "credit", amount: 500 },
      membersInTier: 412,
      isActive: true,
    },
    {
      id: "t3",
      name: "Mumzo champion",
      threshold: 5,
      reward: { kind: "credit", amount: 1000 },
      membersInTier: 96,
      isActive: true,
    },
    {
      id: "t4",
      name: "Community builder",
      threshold: 10,
      reward: { kind: "free_delivery", count: 12 },
      membersInTier: 18,
      isActive: false,
    },
  ],
  codes: [
    {
      id: "c1",
      code: "FRIEND150",
      refereeReward: 150,
      usedCount: 2140,
      isActive: true,
    },
    {
      id: "c2",
      code: "DUO20",
      refereeReward: 0,
      usedCount: 388,
      isActive: true,
    },
    {
      id: "c3",
      code: "MONSOON100",
      refereeReward: 100,
      usedCount: 1902,
      isActive: false,
    },
  ],
};

export const referralStats: ReferralStats = {
  totalReferrers: 2366,
  successfulReferrals: 4880,
  pendingReferrals: 517,
  rewardsPaidThisMonth: 412_500,
};

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
