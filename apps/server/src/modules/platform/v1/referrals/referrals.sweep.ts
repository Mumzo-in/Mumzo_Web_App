import { NOTIFICATION_TEMPLATE, notify } from "@mumzo/notifications";

import * as repo from "./referrals.repo";
import { settleReferral } from "./referrals.service";

/** How often the sweep scans for referrals whose return window has passed. */
const SWEEP_INTERVAL_MS = 60 * 60 * 1000; // 1 hour

/** Rows settled per query. The sweep drains in chunks of this size rather
 * than selecting every due row at once, so a backlog (a long outage, a
 * bulk import) can't load an unbounded result set into memory. */
const SETTLEMENT_BATCH_SIZE = 50;

/** Ceiling on chunks per run, so one sweep can't monopolise the process
 * (and its pooled connections) indefinitely — leftovers are picked up by
 * the next interval, which is exactly what the batching is for. */
const MAX_BATCHES_PER_RUN = 20;

/**
 * Settlement sweep: finds every referral stuck in `order_placed` whose
 * return window has passed with no return, and settles each one. This is
 * the return-window gate from docs/platform/referral_system_architecture.md
 * §4 — coupons are only ever issued here, never at delivery time.
 *
 * One row at a time with its own try/catch, so a single bad row (a missing
 * user, a race with a return that landed mid-sweep) can't abort the batch.
 *
 * Drains in bounded chunks: each pass settles at most
 * `SETTLEMENT_BATCH_SIZE` rows, and a run stops after
 * `MAX_BATCHES_PER_RUN` chunks even if more are due.
 */
export async function runSettlementSweep() {
  for (let batch = 0; batch < MAX_BATCHES_PER_RUN; batch++) {
    const due = await repo.findDueForSettlement(
      new Date(),
      SETTLEMENT_BATCH_SIZE,
    );

    if (due.length === 0) {
      return;
    }

    for (const row of due) {
      try {
        const result = await settleReferral(row.id);
        if (result?.capped) {
          console.warn(
            `Referral ${row.id} settled for ${row.referrerUserId} but hit the monthly reward cap — no coupon issued.`,
          );
        }
        if (result?.couponId && result.referrerName) {
          await notify
            .send({
              userId: row.referrerUserId,
              templateId: NOTIFICATION_TEMPLATE.REFERRAL.COUPON_ISSUED,
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

    // A short chunk means the backlog is drained — the next interval picks
    // up anything that became due in the meantime.
    if (due.length < SETTLEMENT_BATCH_SIZE) {
      return;
    }
  }

  console.warn(
    `Referral settlement sweep hit its ${MAX_BATCHES_PER_RUN}-batch ceiling — remaining rows deferred to the next run.`,
  );
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
