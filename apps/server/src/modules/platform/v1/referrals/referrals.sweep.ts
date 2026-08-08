import { notify } from "@mumzo/notifications";

import * as repo from "./referrals.repo";
import { settleReferral } from "./referrals.service";

/** How often the sweep scans for referrals whose return window has passed. */
const SWEEP_INTERVAL_MS = 60 * 60 * 1000; // 1 hour

/**
 * Settlement sweep: finds every referral stuck in `order_placed` whose
 * return window has passed with no return, and settles each one. This is
 * the return-window gate from docs/platform/referral_system_architecture.md
 * §4 — coupons are only ever issued here, never at delivery time.
 *
 * One row at a time with its own try/catch, so a single bad row (a missing
 * user, a race with a return that landed mid-sweep) can't abort the batch.
 */
export async function runSettlementSweep() {
  const due = await repo.findDueForSettlement(new Date());

  for (const row of due) {
    try {
      const result = await settleReferral(row.id);
      if (result?.couponId && result.referrerName) {
        await notify
          .send({
            userId: row.referrerUserId,
            templateId: "referral.coupon_issued",
            data: {
              tierName: result.tierName,
              amount: result.amount,
            },
          })
          .catch((error) => {
            console.error(
              `Failed to enqueue referral coupon notification for ${row.referrerUserId}:`,
              error,
            );
          });
      }
    } catch (error) {
      console.error(`Settlement sweep failed for referral ${row.id}:`, error);
    }
  }
}

/**
 * Starts the in-process settlement sweep, mirroring
 * `startNotificationWorker()` — same Bun process as the API, closed on
 * shutdown so an in-flight sweep isn't abandoned mid-batch.
 */
export function startReferralSettlementSweep() {
  // Runs once at boot so a server restart doesn't leave overdue referrals
  // waiting a full interval before the first sweep.
  runSettlementSweep().catch((error) => {
    console.error("Initial referral settlement sweep failed:", error);
  });

  const timer = setInterval(() => {
    runSettlementSweep().catch((error) => {
      console.error("Referral settlement sweep failed:", error);
    });
  }, SWEEP_INTERVAL_MS);

  return {
    close: () => {
      clearInterval(timer);
    },
  };
}
