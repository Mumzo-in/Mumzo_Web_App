import { apiRequest } from "@/core/api/client";

/**
 * "Complete your profile" onboarding — see
 * `apps/server/src/modules/platform/v1/profile/profile.schema.ts` for the
 * matching server shape. Name is the only required field; email and every
 * baby entry are optional — `babies` may be omitted or empty. Requires a
 * signed-in session (`requireAuth` on the server), which `apiRequest`
 * already sends via `credentials: "include"`.
 */
export type OnboardingBaby = {
  name: string;
  dob: string;
  gender?: "girl" | "boy" | "other";
};

export type OnboardingInput = {
  name: string;
  email?: string;
  babies?: OnboardingBaby[];
  /** Referral code of the friend who invited this user, if any. */
  referralCode?: string;
};

export type OnboardingResult = {
  id: string;
  name: string;
  email: string;
  onboardedAt: string;
  /** True only when a referral code was submitted AND actually applied. */
  referralApplied: boolean;
};

export function completeOnboarding(
  input: OnboardingInput,
): Promise<OnboardingResult> {
  return apiRequest<OnboardingResult>("/profile/onboarding", {
    method: "POST",
    body: input,
  });
}

/** Checks whether a phone number already has an account — called before
 * sending the signup OTP so a returning number is redirected to log in
 * instead of starting a second, redundant signup. */
export function checkPhoneExists(phoneNumber: string): Promise<{
  exists: boolean;
}> {
  return apiRequest<{ exists: boolean }>("/profile/check-phone", {
    query: { phoneNumber },
  });
}
