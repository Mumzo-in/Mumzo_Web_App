import { mockDetail, mockList } from "@/core/api/mock";
import type { ListParams } from "@/core/api/query-keys";
import {
  type ReferralActivityEvent,
  type ReferralCoupon,
  type ReferralInvite,
  type ReferralParticipant,
  type ReferralProgramConfig,
  type ReferralStats,
  referralActivity,
  referralConfig,
  referralCoupons,
  referralInvitesByParticipant,
  referralParticipants,
  referralStats,
} from "../data/referral-data";

/**
 * Referrals API — no §15 endpoint is specced yet (this module needs an API
 * spec). Swaps to `apiRequest`/`apiList` against `/referrals/*` once it
 * exists; every function here keeps the shape the real client will return.
 */
export function getReferralConfig(): Promise<ReferralProgramConfig> {
  return mockDetail(referralConfig);
}

export function getReferralStats(): Promise<ReferralStats> {
  return mockDetail(referralStats);
}

export function getReferralActivity(): Promise<ReferralActivityEvent[]> {
  return mockDetail(referralActivity);
}

export function listReferralParticipants(params: ListParams) {
  return mockList<ReferralParticipant>({
    rows: referralParticipants,
    params,
    searchFields: ["name", "code"],
  });
}

export function getReferralParticipant(
  id: string,
): Promise<ReferralParticipant> {
  return mockDetail(referralParticipants.find((p) => p.id === id));
}

export function getReferralInvites(
  participantId: string,
): Promise<ReferralInvite[]> {
  return mockDetail(referralInvitesByParticipant[participantId] ?? []);
}

export function listReferralCoupons(params: ListParams) {
  const status =
    typeof params.status === "string" && params.status !== "all"
      ? params.status
      : undefined;

  return mockList<ReferralCoupon>({
    rows: referralCoupons,
    params,
    searchFields: ["code", "referrerName"],
    filter: status ? (row) => row.status === status : undefined,
  });
}
