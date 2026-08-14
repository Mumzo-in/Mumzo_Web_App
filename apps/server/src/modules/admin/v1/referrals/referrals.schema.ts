import { z } from "@hono/zod-openapi";

export const referralTierSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    threshold: z.number(),
    couponAmount: z.number(),
    membersInTier: z.number(),
    isActive: z.boolean(),
  })
  .openapi("AdminReferralTier");

export const referralRulesSchema = z
  .object({
    returnWindowHours: z.number(),
    couponValidityDays: z.number(),
    monthlyCapPerUser: z.number(),
    refereeReward: z.number(),
    selfReferralBlock: z.boolean(),
    codePattern: z.string(),
    /** When true, a referrer's tier coupon becomes claimable as soon as the
     * friend's order is delivered, instead of waiting for the return
     * window. The referrer must still claim it to start its validity
     * clock (`couponValidityDays` from claim, not from issuance). */
    settleOnDelivery: z.boolean(),
  })
  .openapi("ReferralRules");

export const referralConfigSchema = z
  .object({
    isEnabled: z.boolean(),
    codePattern: z.string(),
    rules: referralRulesSchema,
    tiers: z.array(referralTierSchema),
  })
  .openapi("ReferralProgramConfig");

export const referralStatsSchema = z
  .object({
    totalReferrers: z.number(),
    successfulReferrals: z.number(),
    pendingReferrals: z.number(),
    rewardsPaidThisMonth: z.number(),
    funnel: z.object({
      linkShared: z.number(),
      signedUp: z.number(),
      orderPlaced: z.number(),
      completed: z.number(),
    }),
  })
  .openapi("ReferralStats");

export const referralActivityEventSchema = z
  .object({
    id: z.string(),
    referrerName: z.string(),
    message: z.string(),
    at: z.string(),
  })
  .openapi("ReferralActivityEvent");

export const updateRulesSchema = z.object({
  returnWindowHours: z.number().int().min(0).optional(),
  couponValidityDays: z.number().int().min(1).optional(),
  monthlyCapPerUser: z.number().int().min(0).optional(),
  refereeReward: z.number().int().min(0).optional(),
  selfReferralBlock: z.boolean().optional(),
  codePattern: z.string().trim().min(1).max(60).optional(),
  settleOnDelivery: z.boolean().optional(),
});

export const createTierSchema = z.object({
  name: z.string().min(1).max(120),
  threshold: z.number().int().positive(),
  couponAmount: z.number().int().positive(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});

export const updateTierSchema = createTierSchema.partial();

export const tierIdParamSchema = z.object({
  id: z
    .string()
    .min(1)
    .openapi({ param: { name: "id", in: "path" } }),
});

export const listParticipantsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().trim().min(1).optional(),
});

export const referralParticipantSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    code: z.string(),
    totalReferred: z.number(),
    successfulReferrals: z.number(),
    couponsIssued: z.number(),
    joinedAt: z.string(),
  })
  .openapi("ReferralParticipant");

export const participantIdParamSchema = z.object({
  userId: z
    .string()
    .min(1)
    .openapi({ param: { name: "userId", in: "path" } }),
});

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
  .openapi("AdminReferralInvite");

export const listCouponsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().trim().min(1).optional(),
  status: z.enum(["active", "used", "expired", "revoked"]).optional(),
});

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
    referrerName: z.string(),
    amount: z.number(),
    status: couponStatusSchema,
    issuedAt: z.string(),
    expiresAt: z.string().nullable(),
    usedInOrderId: z.string().nullable(),
  })
  .openapi("AdminReferralCoupon");
