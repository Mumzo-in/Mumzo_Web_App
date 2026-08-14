import { apiRequest } from "@/core/api/client";

export type PendingReview = { id: string; orderId: string } | null;

export type OrderReview = {
  rating: number | null;
  comment: string | null;
  respondedAt: string | null;
} | null;

/** The single oldest delivered order still owed a review, if any — "one at
 * a time" per the product design, never a batch of all pending orders. */
export function getPendingReview(): Promise<PendingReview> {
  return apiRequest<PendingReview>("/reviews/pending");
}

/** This order's review, if the signed-in user already rated it — powers
 * the standalone review page's "already reviewed" state. */
export function getReviewForOrder(orderId: string): Promise<OrderReview> {
  return apiRequest<OrderReview>(`/reviews/${orderId}`);
}

export function submitReview(
  orderId: string,
  input: { rating: number; comment?: string },
): Promise<{ showReferralPrompt: boolean }> {
  return apiRequest<{ showReferralPrompt: boolean }>(`/reviews/${orderId}`, {
    method: "POST",
    body: input,
  });
}

export function skipReferralPrompt(orderId: string): Promise<{ ok: true }> {
  return apiRequest<{ ok: true }>(`/reviews/${orderId}/skip-referral-prompt`, {
    method: "POST",
  });
}
