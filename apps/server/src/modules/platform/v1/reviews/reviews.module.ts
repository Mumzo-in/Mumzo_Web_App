import { createRouter, requireAuth } from "@/core";
import { unauthorized } from "@/core/errors";
import {
  getPendingReviewRoute,
  getReviewForOrderRoute,
  skipReferralPromptRoute,
  submitReviewRoute,
} from "./reviews.routes";
import {
  getPendingReview,
  getReviewForOrder,
  skipReferralPrompt,
  submitReview,
} from "./reviews.service";

/**
 * Post-delivery review prompts — a lightweight overall-order rating shown
 * as a popup, gating a referral nudge on rating >= 3. See
 * packages/db/src/schema/reviews.ts for the full flow.
 */

const app = createRouter();

app.use("*", requireAuth);

app.openapi(getPendingReviewRoute, async (c) => {
  const authUser = c.get("user");
  if (!authUser) {
    throw unauthorized();
  }

  const data = await getPendingReview(authUser.id);
  return c.json({ success: true as const, data }, 200);
});

app.openapi(getReviewForOrderRoute, async (c) => {
  const authUser = c.get("user");
  if (!authUser) {
    throw unauthorized();
  }

  const { orderId } = c.req.valid("param");
  const data = await getReviewForOrder(authUser.id, orderId);
  return c.json({ success: true as const, data }, 200);
});

app.openapi(submitReviewRoute, async (c) => {
  const authUser = c.get("user");
  if (!authUser) {
    throw unauthorized();
  }

  const { orderId } = c.req.valid("param");
  const body = c.req.valid("json");
  const data = await submitReview(authUser.id, orderId, body);
  return c.json({ success: true as const, data }, 200);
});

app.openapi(skipReferralPromptRoute, async (c) => {
  const authUser = c.get("user");
  if (!authUser) {
    throw unauthorized();
  }

  const { orderId } = c.req.valid("param");
  const data = await skipReferralPrompt(authUser.id, orderId);
  return c.json({ success: true as const, data }, 200);
});

export default app;
