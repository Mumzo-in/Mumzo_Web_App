import { z } from "@hono/zod-openapi";

export const referralTierSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    threshold: z.number(),
    couponAmount: z.number(),
  })
  .openapi("ReferralTier");

export const referralProgramSchema = z
  .object({
    tiers: z.array(referralTierSchema),
    /** Reward the referred friend gets on their first order, in rupees. */
    refereeReward: z.number(),
  })
  .openapi("ReferralProgram");

export const validateCodeParamsSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1)
    .openapi({
      param: { name: "code", in: "path" },
      example: "ANANYA150",
    }),
});

export const validateCodeResultSchema = z
  .object({
    valid: z.literal(true),
    code: z.string(),
    referrerName: z.string(),
    /** Reward the referred friend gets on their first order, in rupees. */
    refereeReward: z.number(),
    /** True when the signed-in viewer owns this code — their own link. */
    isSelf: z.boolean(),
  })
  .openapi("ValidateReferralCodeResult");

export const trackClickSchema = z
  .object({
    code: z.string().trim().min(1),
  })
  .openapi("TrackReferralClickInput");

const inviteStatusSchema = z.enum([
  "link_shared",
  "signed_up",
  "order_placed",
  "completed",
  "returned",
]);

export const referralInviteSchema = z
  .object({
    id: z.string(),
    refereeName: z.string(),
    status: inviteStatusSchema,
    updatedAt: z.string(),
  })
  .openapi("ReferralInvite");

const couponStatusSchema = z.enum([
  "active",
  "used",
  "expired",
  "revoked",
  "claimable",
]);

export const referralCouponSchema = z
  .object({
    id: z.string(),
    code: z.string(),
    discountAmount: z.number(),
    status: couponStatusSchema,
    /** Null while the coupon is still `claimable` — the validity window
     * hasn't started yet. */
    expiresAt: z.string().nullable(),
  })
  .openapi("ReferralCoupon");

export const myReferralsSchema = z
  .object({
    code: z.string(),
    /** Whether the user has placed at least one order themselves — the
     * referral programme only activates for them after their first order. */
    hasOrdered: z.boolean(),
    successfulReferrals: z.number(),
    invites: z.array(referralInviteSchema),
    coupons: z.array(referralCouponSchema),
  })
  .openapi("MyReferrals");

export const claimCouponResultSchema = z
  .object({
    expiresAt: z.string(),
  })
  .openapi("ClaimCouponResult");
