import { apiList, apiRequest } from "@/core/api/client";
import type { ListParams } from "@/core/api/query-keys";
import {
  nextTier,
  type ReferralActivityEvent,
  type ReferralCoupon,
  type ReferralInvite,
  type ReferralParticipant,
  type ReferralProgramConfig,
  type ReferralRules,
  type ReferralStats,
} from "../data/referral-data";

/** Referrals API — backed by apps/server/.../admin/v1/referrals. */

/** Cheap in-memory cache for the tier ladder — participants/participant
 * detail need it to derive `currentTierName` (the server's participant
 * payload only carries `successfulReferrals`, not a resolved tier name).
 * Cleared on any tier write so it can't serve stale data after a mutation. */
let tiersCache: ReferralProgramConfig["tiers"] | null = null;

async function getTiers() {
  if (tiersCache) {
    return tiersCache;
  }
  const config = await getReferralConfig();
  tiersCache = config.tiers;
  return config.tiers;
}

/** The tier a referrer has *reached* (highest threshold met), not the next
 * one to unlock — `nextTier` finds the upcoming rung, so this walks the
 * ladder for the last one already crossed. */
function currentTierName(
  tiers: ReferralProgramConfig["tiers"],
  successfulReferrals: number,
): string | null {
  const upcoming = nextTier(tiers, successfulReferrals);
  const reached = [...tiers]
    .filter((tier) => tier.id !== upcoming?.id)
    .sort((a, b) => b.threshold - a.threshold)
    .find((tier) => successfulReferrals >= tier.threshold);
  return reached?.name ?? null;
}

export function getReferralConfig(): Promise<ReferralProgramConfig> {
  return apiRequest<ReferralProgramConfig>("/referrals/config");
}

export function getReferralStats(): Promise<ReferralStats> {
  return apiRequest<ReferralStats>("/referrals/stats");
}

export function getReferralActivity(): Promise<ReferralActivityEvent[]> {
  return apiRequest<ReferralActivityEvent[]>("/referrals/activity");
}

type RawParticipant = Omit<ReferralParticipant, "currentTierName">;

export async function listReferralParticipants(params: ListParams) {
  const [page, tiers] = await Promise.all([
    apiList<RawParticipant>("/referrals/participants", params),
    getTiers(),
  ]);
  return {
    ...page,
    data: page.data.map(
      (row): ReferralParticipant => ({
        ...row,
        currentTierName: currentTierName(tiers, row.successfulReferrals),
      }),
    ),
  };
}

export async function getReferralParticipant(
  id: string,
): Promise<ReferralParticipant> {
  const [row, tiers] = await Promise.all([
    apiRequest<RawParticipant>(`/referrals/participants/${id}`),
    getTiers(),
  ]);
  return {
    ...row,
    currentTierName: currentTierName(tiers, row.successfulReferrals),
  };
}

export function getReferralInvites(
  participantId: string,
): Promise<ReferralInvite[]> {
  return apiRequest<ReferralInvite[]>(
    `/referrals/participants/${participantId}/invites`,
  );
}

export function listReferralCoupons(params: ListParams) {
  return apiList<ReferralCoupon>("/referrals/coupons", params);
}

export type ReferralRulesInput = Partial<ReferralRules>;

export function updateReferralRules(
  input: ReferralRulesInput,
): Promise<ReferralRules> {
  return apiRequest<ReferralRules>("/referrals/rules", {
    method: "PATCH",
    body: input,
  });
}

export type ReferralTierInput = {
  name: string;
  threshold: number;
  couponAmount: number;
  isActive: boolean;
  sortOrder: number;
};

export async function createReferralTier(
  input: ReferralTierInput,
): Promise<{ id: string }> {
  const result = await apiRequest<{ id: string }>("/referrals/tiers", {
    method: "POST",
    body: input,
  });
  tiersCache = null;
  return result;
}

export async function updateReferralTier(
  id: string,
  input: Partial<ReferralTierInput>,
): Promise<void> {
  await apiRequest<{ ok: true }>(`/referrals/tiers/${id}`, {
    method: "PATCH",
    body: input,
  });
  tiersCache = null;
}

export async function deleteReferralTier(id: string): Promise<void> {
  await apiRequest<{ ok: true }>(`/referrals/tiers/${id}`, {
    method: "DELETE",
  });
  tiersCache = null;
}
