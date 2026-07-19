import { mockDetail } from "@/core/api/mock";
import {
  type ReferralProgramConfig,
  type ReferralStats,
  referralConfig,
  referralStats,
} from "../data/referral-data";

/**
 * Referrals API — no §15 endpoint is specced yet (this module needs an API
 * spec). Swaps to `apiRequest<ReferralProgramConfig>("/referrals/config")`
 * and `/referrals/stats` when they exist.
 */
export function getReferralConfig(): Promise<ReferralProgramConfig> {
  return mockDetail(referralConfig);
}

export function getReferralStats(): Promise<ReferralStats> {
  return mockDetail(referralStats);
}
