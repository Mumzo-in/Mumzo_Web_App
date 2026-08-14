import { getTemplate, renderTemplate } from "@mumzo/notifications";

import { badRequest, notFound } from "@/core/errors";
import * as repo from "./reviews.repo";

/** Every delivered order gets a prompt for a user's first N orders — after
 * that, prompts throttle down to avoid fatiguing frequent shoppers. */
const GUARANTEED_PROMPT_ORDER_COUNT = 5;
/** Past the guaranteed window, only every Nth delivered order gets prompted. */
const THROTTLE_EVERY_NTH_ORDER = 3;

/**
 * Stand-in for the real push/SMS/email send — the template is real
 * (registered + schema-validated, so this proves the payload shape is
 * correct) but dispatch is a console.log until the delivery channel for
 * this template is wired up. Swapping in `notify.send(...)` here is a
 * one-line change once that's ready.
 *
 * TODO(notifications): replace this console.log with a real
 * `notify.send({ userId, templateId: "review.prompt_requested", data })`
 * call once delayed/scheduled sends are supported — see
 * packages/notifications' worker/queue docs for the gap this depends on.
 */
function notifyReviewPromptRequested(userId: string, orderId: string) {
  getTemplate("review.prompt_requested"); // throws if the template is misregistered
  const rendered = renderTemplate("review.prompt_requested", "fcm", {
    orderId,
  });
  console.log(
    `[notify:stub] review.prompt_requested -> user ${userId}:`,
    rendered,
  );
}

/**
 * Called from the order-status hook on `delivered`. Only creates the review
 * row (idempotent — `orderId` is unique) — the actual notify decision (does
 * this order's turn get a prompt, per the guaranteed-first-5 / throttle
 * rule) happens in the sweep, not here, since notifications are meant to
 * come from the cron-driven notification system rather than fire inline.
 */
export async function onOrderDelivered(orderId: string, userId: string) {
  await repo.insertPending(orderId, userId);
}

/**
 * Sweep step: for each un-notified review row, decides — via the
 * guaranteed-first-5 / throttle-after-that rule — whether this delivered
 * order's turn has come to prompt for a review, and notifies if so.
 */
export async function runReviewPromptSweep() {
  const pending = await repo.findUnnotified(50);

  for (const row of pending) {
    const deliveredCount = await repo.countDeliveredOrders(row.userId);
    const withinGuaranteedWindow =
      deliveredCount <= GUARANTEED_PROMPT_ORDER_COUNT;
    const isThrottleTurn =
      (deliveredCount - GUARANTEED_PROMPT_ORDER_COUNT) %
        THROTTLE_EVERY_NTH_ORDER ===
      0;

    if (!withinGuaranteedWindow && !isThrottleTurn) {
      continue; // Throttled — this delivered order doesn't get a prompt.
    }

    await repo.markNotified(row.id);
    notifyReviewPromptRequested(row.userId, row.orderId);
  }
}

/** The one review, oldest first, this user still owes a rating — "one at a
 * time" per the product ask. Only ever surfaces a row that was actually
 * notified (never a throttled-out one). */
export async function getPendingReview(userId: string) {
  const row = await repo.findNextPendingForUser(userId);
  if (!row?.notifiedAt) {
    return null;
  }
  return { id: row.id, orderId: row.orderId };
}

/** The review state for one specific order, if any — powers the standalone
 * `/orders/:orderId/review` page so it can show a read-only "you already
 * reviewed this" state instead of re-prompting for a rating. Returns null
 * for an order with no review row (not yet delivered, or a different
 * user's order) rather than throwing — the page treats "nothing yet" as
 * a normal, expected state. */
export async function getReviewForOrder(userId: string, orderId: string) {
  const row = await repo.findByOrderId(orderId);
  if (!row || row.userId !== userId) {
    return null;
  }
  return {
    rating: row.rating,
    comment: row.comment,
    respondedAt: row.respondedAt?.toISOString() ?? null,
  };
}

export async function submitReview(
  userId: string,
  orderId: string,
  input: { rating: number; comment?: string },
) {
  const row = await repo.findByOrderId(orderId);
  if (!row || row.userId !== userId) {
    throw notFound("Review");
  }
  // The low-rating flow calls this twice for the same order — once for the
  // star rating, once more to attach the "what went wrong" comment — so a
  // prior response is only a hard conflict when the rating itself would
  // change. Once given, a rating is immutable; the comment can still land.
  if (row.respondedAt && row.rating !== null && row.rating !== input.rating) {
    throw badRequest("This order has already been reviewed.");
  }

  await repo.submitRating({
    id: row.id,
    rating: input.rating,
    comment: input.comment ?? row.comment,
  });

  // Within the guaranteed-first-5 window, push the referral ask regardless
  // of rating — a low rating still gets the "what went wrong" question
  // first, but doesn't exempt the order from the referral nudge after.
  // Past that window, the nudge is reserved for genuinely happy customers.
  const deliveredCount = await repo.countDeliveredOrders(userId);
  const showReferralPrompt =
    deliveredCount <= GUARANTEED_PROMPT_ORDER_COUNT || input.rating >= 3;

  if (showReferralPrompt) {
    await repo.markReferralPromptShown(row.id);
  }

  return { showReferralPrompt };
}

export async function skipReferralPrompt(userId: string, orderId: string) {
  const row = await repo.findByOrderId(orderId);
  if (!row || row.userId !== userId) {
    throw notFound("Review");
  }
  await repo.markReferralPromptSkipped(row.id);
  return { ok: true as const };
}
