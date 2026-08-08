import { z } from "@hono/zod-openapi";

const onboardingBabySchema = z.object({
  name: z.string().trim().min(1, "Baby's name is required").max(120),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "dob must be YYYY-MM-DD"),
  gender: z.enum(["girl", "boy", "other"]).optional(),
});

/**
 * Onboarding request body. `name` is the one truly required field — a fresh
 * account's `user.name` is a raw phone-number placeholder
 * (`signUpOnVerification.getTempName`) until this endpoint runs. Email and
 * every baby entry are optional per the product decision (name mainly, rest
 * skippable) — `babies` may be an empty array.
 */
export const completeOnboardingSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required").max(120),
    email: z.string().trim().email().optional(),
    babies: z.array(onboardingBabySchema).max(10).optional(),
    /** Referral code of the friend who invited this user, if any. Applied
     * best-effort — an invalid or self-referral code never blocks
     * onboarding, it's just silently skipped. */
    referralCode: z.string().trim().min(1).max(32).optional(),
  })
  .openapi("CompleteOnboardingInput");

export const onboardingResultSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
    onboardedAt: z.string(),
  })
  .openapi("OnboardingResult");
