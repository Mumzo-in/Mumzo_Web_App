import { runReviewPromptSweep } from "./reviews.service";

/** How often the sweep scans for delivered orders still owed a review
 * prompt notification.
 *
 * TODO: 1 minute is a temporary dev-speed value for testing the flow
 * end-to-end quickly — dial back to something like 15 minutes once this is
 * verified, so a low-traffic period doesn't hammer the DB every minute for
 * no reason. */
const SWEEP_INTERVAL_MS = 60 * 1000; // 1 minute

/**
 * Starts the in-process review-prompt sweep, mirroring
 * `startReferralSettlementSweep()` — same Bun process as the API, closed on
 * shutdown so an in-flight sweep isn't abandoned mid-batch. This is the
 * "notifications come from a cron job" piece: the delivery hook only
 * inserts the pending review row, this sweep is what actually decides
 * (guaranteed-first-5 / throttle-after) and fires the notification.
 */
export function startReviewPromptSweep() {
  runReviewPromptSweep().catch((error) => {
    console.error("Initial review prompt sweep failed:", error);
  });

  const timer = setInterval(() => {
    runReviewPromptSweep().catch((error) => {
      console.error("Review prompt sweep failed:", error);
    });
  }, SWEEP_INTERVAL_MS);

  return {
    close: () => {
      clearInterval(timer);
    },
  };
}
