import { z } from "@hono/zod-openapi";

export const pendingReviewSchema = z
  .object({
    id: z.string(),
    orderId: z.string(),
  })
  .nullable()
  .openapi("PendingReview");

export const orderReviewSchema = z
  .object({
    rating: z.number().int().min(1).max(5).nullable(),
    comment: z.string().nullable(),
    respondedAt: z.string().nullable(),
  })
  .nullable()
  .openapi("OrderReview");

export const submitReviewSchema = z
  .object({
    rating: z.number().int().min(1).max(5),
    comment: z.string().trim().max(1000).optional(),
  })
  .openapi("SubmitReviewInput");

export const submitReviewResultSchema = z
  .object({
    /** Whether the referral nudge should show next — rating >= 3. */
    showReferralPrompt: z.boolean(),
  })
  .openapi("SubmitReviewResult");
