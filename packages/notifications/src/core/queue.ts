import { db } from "@mumzo/db";
import { notificationJob } from "@mumzo/db/schema/notifications";

import type { NotificationJobPayload } from "./types";

/** LISTEN/NOTIFY channel name. Shared by the trigger in migration 0016 and
 * the worker's listener — they must agree exactly. */
export const NOTIFICATION_CHANNEL = "notification_job";

/**
 * Default priority. Transactional sends leave this alone; bulk/marketing
 * fan-out should enqueue at a higher number so it sorts behind them.
 */
export const PRIORITY_TRANSACTIONAL = 100;
export const PRIORITY_BULK = 500;

type EnqueueOptions = {
  priority?: number;
  /** Delay before the job first becomes runnable. */
  delayMs?: number;
};

function toRow(job: NotificationJobPayload, options?: EnqueueOptions) {
  return {
    templateId: job.templateId,
    userId: job.userId,
    audience: job.audience ?? "customer",
    payload: job.data,
    priority: options?.priority ?? PRIORITY_TRANSACTIONAL,
    runAfter: options?.delayMs
      ? new Date(Date.now() + options.delayMs)
      : new Date(),
  };
}

/** Enqueues one job. The INSERT trigger fires `pg_notify`, waking an idle
 * worker without waiting for its next poll. */
export async function enqueue(
  job: NotificationJobPayload,
  options?: EnqueueOptions,
): Promise<void> {
  await db.insert(notificationJob).values(toRow(job, options));
}

/**
 * Enqueues many jobs in one INSERT. Chunked because a single statement with
 * tens of thousands of rows is both a very large query and a long lock —
 * fan-out callers pass the whole recipient list and let this split it.
 */
export async function enqueueMany(
  jobs: NotificationJobPayload[],
  options?: EnqueueOptions,
): Promise<void> {
  const CHUNK_SIZE = 1_000;

  for (let i = 0; i < jobs.length; i += CHUNK_SIZE) {
    const chunk = jobs.slice(i, i + CHUNK_SIZE);
    await db
      .insert(notificationJob)
      .values(chunk.map((j) => toRow(j, options)));
  }
}
