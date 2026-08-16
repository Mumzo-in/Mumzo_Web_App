import { apiRequest } from "@/core/api/client";
import type {
  ReferralCoupon,
  ReferralInviteStatus,
  ReferralProgram,
  ReferralTier,
} from "../data/referral-data";

/** Referrals API — backed by apps/server/.../platform/v1/referrals. Maps the
 * server's tier/coupon/invite shapes onto this module's existing
 * `ReferralProgram` type so every component built against mock data keeps
 * working unchanged — this file is the one-file swap. */

type ServerTier = {
  id: string;
  name: string;
  threshold: number;
  couponAmount: number;
};
type ServerProgram = { tiers: ServerTier[]; refereeReward: number };

function toTiers(tiers: ServerTier[]): ReferralTier[] {
  return tiers.map((tier) => ({
    id: tier.id,
    name: tier.name,
    threshold: tier.threshold,
    reward: { kind: "coupon" as const, amount: tier.couponAmount },
    blurb: `₹${tier.couponAmount} off your next order.`,
  }));
}

/** Public tier ladder — no auth required, powers the guest view. Also
 * carries `refereeReward` (admin-configured, `referral_rules.refereeRewardRupees`)
 * so invite copy never drifts from what the settlement engine actually
 * issues. */
export async function getReferralProgram(): Promise<
  Pick<ReferralProgram, "tiers"> & { refereeReward: number }
> {
  const data = await apiRequest<ServerProgram>("/referrals/program");
  return { tiers: toTiers(data.tiers), refereeReward: data.refereeReward };
}

type ServerInvite = {
  id: string;
  refereeName: string;
  status: ReferralInviteStatus;
  updatedAt: string;
};

type ServerCoupon = {
  id: string;
  code: string;
  discountAmount: number;
  status: ReferralCoupon["status"];
  expiresAt: string;
};

type ServerMyReferrals = {
  code: string;
  hasOrdered: boolean;
  successfulReferrals: number;
  invites: ServerInvite[];
  coupons: ServerCoupon[];
};

/** The signed-in customer's code, invites, and coupons — merged with the
 * public tier ladder into the full `ReferralProgram` shape the page and its
 * child components expect. */
export async function getMyReferralProgram(): Promise<ReferralProgram> {
  const [program, mine] = await Promise.all([
    getReferralProgram(),
    apiRequest<ServerMyReferrals>("/referrals/me"),
  ]);

  return {
    code: mine.code,
    hasOrdered: mine.hasOrdered,
    successfulReferrals: mine.successfulReferrals,
    tiers: program.tiers,
    offers: [],
    refereeReward: program.refereeReward,
    coupons: mine.coupons.map((c) => ({
      id: c.id,
      code: c.code,
      discountAmount: c.discountAmount,
      status: c.status,
      expiresAt: c.expiresAt,
    })),
    invites: mine.invites.map((invite) => ({
      id: invite.id,
      name: invite.refereeName,
      status: invite.status,
    })),
  };
}

export type ValidateReferralCodeResult = {
  valid: true;
  code: string;
  referrerName: string;
  refereeReward: number;
  isSelf: boolean;
};

/** Checks a code exists without recording anything — used for the
 * `/r/$code` landing page's initial render before the click is tracked. */
export function validateReferralCode(
  code: string,
): Promise<ValidateReferralCodeResult> {
  return apiRequest<ValidateReferralCodeResult>(
    `/referrals/validate/${encodeURIComponent(code)}`,
  );
}

/** Records a `link_shared` referral row — call once per landing, not on
 * every render. */
export function trackReferralClick(
  code: string,
): Promise<ValidateReferralCodeResult> {
  return apiRequest<ValidateReferralCodeResult>("/referrals/track-click", {
    method: "POST",
    body: { code },
  });
}
