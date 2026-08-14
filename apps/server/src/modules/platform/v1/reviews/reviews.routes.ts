import { createRoute, z } from "@hono/zod-openapi";

import { commonErrorResponses, jsonContent, successSchema } from "@/core";
import {
  orderReviewSchema,
  pendingReviewSchema,
  submitReviewResultSchema,
  submitReviewSchema,
} from "./reviews.schema";

const TAG = "Platform | Reviews";

export const getPendingReviewRoute = createRoute({
  method: "get",
  path: "/pending",
  tags: [TAG],
  summary: "The single oldest delivered order still awaiting a review, if any",
  security: [{ cookieAuth: [] }],
  responses: {
    200: jsonContent(successSchema(pendingReviewSchema), "Pending review"),
    ...commonErrorResponses,
  },
});

export const getReviewForOrderRoute = createRoute({
  method: "get",
  path: "/{orderId}",
  tags: [TAG],
  summary: "This order's review, if the caller has already rated it",
  security: [{ cookieAuth: [] }],
  request: { params: z.object({ orderId: z.string() }) },
  responses: {
    200: jsonContent(successSchema(orderReviewSchema), "Order review"),
    ...commonErrorResponses,
  },
});

export const submitReviewRoute = createRoute({
  method: "post",
  path: "/{orderId}",
  tags: [TAG],
  summary: "Rate a delivered order",
  security: [{ cookieAuth: [] }],
  request: {
    params: z.object({ orderId: z.string() }),
    body: {
      content: { "application/json": { schema: submitReviewSchema } },
    },
  },
  responses: {
    200: jsonContent(successSchema(submitReviewResultSchema), "Review saved"),
    ...commonErrorResponses,
  },
});

export const skipReferralPromptRoute = createRoute({
  method: "post",
  path: "/{orderId}/skip-referral-prompt",
  tags: [TAG],
  summary: "Dismiss the referral nudge shown after a 3+ star review",
  security: [{ cookieAuth: [] }],
  request: {
    params: z.object({ orderId: z.string() }),
  },
  responses: {
    200: jsonContent(
      successSchema(z.object({ ok: z.literal(true) })),
      "Skipped",
    ),
    ...commonErrorResponses,
  },
});
