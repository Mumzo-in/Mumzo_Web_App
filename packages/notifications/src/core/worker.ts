import { env } from "@mumzo/env/server";
import { Client } from "pg";

import {
  type ClaimedJob,
  claimJobs,
  completeJob,
  failJob,
  reclaimStalledJobs,
  toJobPayload,
} from "./claim";
import { processNotificationJob } from "./dispatcher";
import { NOTIFICATION_CHANNEL } from "./queue";

/**
 * Safety-net poll interval. LISTEN/NOTIFY handles the common case within
 * milliseconds, but polling is not optional: NOTIFY is fire-and-forget and
 * is dropped outright if no session is listening, so anything enqueued
 * while the worker was restarting would otherwise sit pending forever.
 * Polling also covers delayed retries, which NOTIFY cannot express at all.
 */
const POLL_INTERVAL_MS = 5_000;

/** How long a `processing` row may sit untouched before it is assumed to
 * belong to a dead worker and returned to the pool. Must exceed the
 * slowest realistic job by a wide margin — too low and an in-flight job is
 * resurrected and delivered twice. */
const STALLED_JOB_TIMEOUT_MS = 5 * 60 * 1000;

/** How often to look for those stalled rows. */
const RECLAIM_INTERVAL_MS = 60 * 1000;

/** Delay before retrying a dropped LISTEN connection. */
const LISTEN_RETRY_MS = 5_000;

export type NotificationWorker = {
  close: () => Promise<void>;
};

/**
 * Starts the in-process notification worker. Call once on server boot; call
 * `.close()` during graceful shutdown so in-flight jobs aren't abandoned
 * mid-send.
 *
 * Two wake sources, one drain loop: a `pg_notify` listener for latency and
 * an interval poll for durability. Both funnel into `drain()`, which is
 * guarded so the two can never run it concurrently.
 */
export function startNotificationWorker(): NotificationWorker {
  const concurrency = env.NOTIFICATION_WORKER_CONCURRENCY;

  let stopped = false;
  let draining = false;
  /** Set when a wake arrives mid-drain, so the loop goes round once more
   * instead of losing the signal. */
  let wakePending = false;
  let listener: Client | undefined;
  let listenRetryTimer: ReturnType<typeof setTimeout> | undefined;

  async function runJob(job: ClaimedJob) {
    try {
      await processNotificationJob(toJobPayload(job));
      await completeJob(job.id);
    } catch (error) {
      const outcome = await failJob(job, error);
      if (outcome === "dead") {
        console.error(
          `[notifications] job ${job.id} (${job.templateId}) dead after ${job.attempts} attempts:`,
          error,
        );
      } else {
        console.warn(
          `[notifications] job ${job.id} (${job.templateId}) attempt ${job.attempts} failed, retrying:`,
          error,
        );
      }
    }
  }

  /** Claims and runs jobs until the queue has none runnable. */
  async function drain() {
    if (draining || stopped) {
      wakePending = true;
      return;
    }

    draining = true;
    try {
      do {
        wakePending = false;

        while (!stopped) {
          const jobs = await claimJobs(concurrency);
          if (jobs.length === 0) {
            break;
          }
          await Promise.all(jobs.map(runJob));
        }
      } while (wakePending && !stopped);
    } catch (error) {
      console.error("[notifications] drain failed:", error);
    } finally {
      draining = false;
    }
  }

  function wake() {
    drain().catch((error) => {
      console.error("[notifications] wake failed:", error);
    });
  }

  /**
   * The LISTEN connection is a dedicated `pg.Client`, deliberately outside
   * the shared pool: a listening session is held open indefinitely, so
   * taking it from the pool would permanently consume one of the
   * connections request handlers need.
   */
  async function startListener() {
    if (stopped) return;

    // Must be the direct (non-pooled) URL where one is configured. A
    // transaction-mode pooler like Supabase's multiplexes sessions across
    // backends, so a LISTEN issued through it silently receives nothing —
    // the queue still drains on its poll interval, just with seconds of
    // latency instead of milliseconds.
    const client = new Client({
      connectionString: env.DATABASE_DIRECT_URL ?? env.DATABASE_URL,
      ssl: env.DATABASE_SSL ? { rejectUnauthorized: true } : false,
    });
    listener = client;

    client.on("notification", () => {
      wake();
    });

    client.on("error", (error) => {
      console.error("[notifications] listener connection error:", error);
      scheduleListenerRetry();
    });

    try {
      await client.connect();
      await client.query(`LISTEN ${NOTIFICATION_CHANNEL}`);
      // Anything enqueued while the listener was down produced a NOTIFY
      // nobody heard — sweep once now rather than waiting for a poll.
      wake();
    } catch (error) {
      console.error("[notifications] failed to start listener:", error);
      scheduleListenerRetry();
    }
  }

  function scheduleListenerRetry() {
    if (stopped || listenRetryTimer) return;

    const previous = listener;
    listener = undefined;
    previous?.end().catch(() => {
      // Already broken — nothing useful to do with a close failure here.
    });

    listenRetryTimer = setTimeout(() => {
      listenRetryTimer = undefined;
      startListener().catch((error) => {
        console.error("[notifications] listener retry failed:", error);
      });
    }, LISTEN_RETRY_MS);
  }

  startListener().catch((error) => {
    console.error("[notifications] listener startup failed:", error);
  });

  const pollTimer = setInterval(wake, POLL_INTERVAL_MS);

  const reclaimTimer = setInterval(() => {
    reclaimStalledJobs(STALLED_JOB_TIMEOUT_MS)
      .then((count) => {
        if (count > 0) {
          console.warn(
            `[notifications] reclaimed ${count} stalled job(s) from a dead worker.`,
          );
          wake();
        }
      })
      .catch((error) => {
        console.error("[notifications] stalled-job reclaim failed:", error);
      });
  }, RECLAIM_INTERVAL_MS);

  // Run once at boot: a previous process that was killed mid-job left its
  // rows in `processing`, and nothing else would ever pick them up.
  reclaimStalledJobs(STALLED_JOB_TIMEOUT_MS).catch((error) => {
    console.error("[notifications] initial stalled-job reclaim failed:", error);
  });

  return {
    async close() {
      stopped = true;
      clearInterval(pollTimer);
      clearInterval(reclaimTimer);
      if (listenRetryTimer) clearTimeout(listenRetryTimer);

      await listener?.end().catch(() => {
        // Shutting down anyway.
      });

      // Let the in-flight drain finish so jobs already claimed are either
      // completed or failed, rather than left stranded in `processing`.
      while (draining) {
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
    },
  };
}
