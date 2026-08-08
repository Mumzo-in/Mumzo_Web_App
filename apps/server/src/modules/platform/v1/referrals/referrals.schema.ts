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

const couponStatusSchema = z.enum(["active", "used", "expired", "revoked"]);

export const referralCouponSchema = z
  .object({
    id: z.string(),
    code: z.string(),
    discountAmount: z.number(),
    status: couponStatusSchema,
    expiresAt: z.string(),
  })
  .openapi("ReferralCoupon");

export const myReferralsSchema = z
  .object({
    code: z.string(),
    successfulReferrals: z.number(),
    invites: z.array(referralInviteSchema),
    coupons: z.array(referralCouponSchema),
  })
  .openapi("MyReferrals");
