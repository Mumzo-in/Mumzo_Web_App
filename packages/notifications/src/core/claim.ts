import { db } from "@mumzo/db";
import { notificationJob } from "@mumzo/db/schema/notifications";
import { eq, sql } from "drizzle-orm";

import type { Audience, NotificationJobPayload } from "./types";

/** Base delay for the retry backoff, matching the policy this queue
 * replaced (BullMQ: 5 attempts, exponential from 5s). */
const BACKOFF_BASE_MS = 5_000;

/** Ceiling on a single backoff step, so a job that has burned several
 * attempts still retries within a useful window rather than hours out. */
const BACKOFF_MAX_MS = 30 * 60 * 1000; // 30 minutes

/**
 * A job row narrowed to what the worker needs, plus the bookkeeping the
 * dispatcher does not care about.
 */
export type ClaimedJob = {
  id: string;
  templateId: string;
  userId: string;
  audience: Audience;
  payload: unknown;
  attempts: number;
  maxAttempts: number;
};

/** What the dispatcher consumes — the claim bookkeeping stripped off. */
export function toJobPayload(job: ClaimedJob): NotificationJobPayload {
  return {
    userId: job.userId,
    templateId: job.templateId,
    data: job.payload,
    audience: job.audience,
  };
}

/**
 * Atomically claims up to `limit` runnable jobs and marks them
 * `processing`.
 *
 * `FOR UPDATE SKIP LOCKED` is what makes a table a safe queue: a concurrent
 * worker running this same statement skips rows this one has locked rather
 * than blocking on them, so the same job can never be handed to two
 * workers. Without SKIP LOCKED, workers serialise behind each other and
 * throughput collapses to one worker's worth.
 *
 * The UPDATE and the SELECT are one statement deliberately — claiming in
 * two steps (select, then update) reopens exactly the race the lock exists
 * to close.
 */
export async function claimJobs(limit: number): Promise<ClaimedJob[]> {
  const rows = await db.execute<{
    id: string;
    template_id: string;
    user_id: string;
    audience: string;
    payload: unknown;
    attempts: number;
    max_attempts: number;
  }>(sql`
    UPDATE ${notificationJob}
    SET status = 'processing',
        attempts = ${notificationJob.attempts} + 1,
        updated_at = now()
    WHERE ${notificationJob.id} IN (
      SELECT ${notificationJob.id}
      FROM ${notificationJob}
      WHERE ${notificationJob.status} = 'pending'
        AND ${notificationJob.runAfter} <= now()
      ORDER BY ${notificationJob.priority}, ${notificationJob.runAfter}
      FOR UPDATE SKIP LOCKED
      LIMIT ${limit}
    )
    RETURNING id, template_id, user_id, audience, payload, attempts, max_attempts
  `);

  return rows.rows.map((row) => ({
    id: row.id,
    templateId: row.template_id,
    userId: row.user_id,
    audience: row.audience === "staff" ? "staff" : "customer",
    payload: row.payload,
    attempts: row.attempts,
    maxAttempts: row.max_attempts,
  }));
}

/** Marks a job done. Terminal — nothing re-reads it but the retention
 * sweep. */
export async function completeJob(id: string): Promise<void> {
  await db
    .update(notificationJob)
    .set({ status: "completed", completedAt: new Date(), lastError: null })
    .where(eq(notificationJob.id, id));
}

/**
 * Records a failed attempt: either schedules the next retry, or moves the
 * job to the dead-letter state when it has no attempts left.
 *
 * `attempts` was already incremented at claim time, so a crashed worker
 * that never reaches this function still burns an attempt rather than
 * letting a poison job retry forever.
 */
export async function failJob(
  job: ClaimedJob,
  error: unknown,
): Promise<"retrying" | "dead"> {
  const message = error instanceof Error ? error.message : String(error);
  const isDead = job.attempts >= job.maxAttempts;

  if (isDead) {
    await db
      .update(notificationJob)
      .set({ status: "dead", lastError: message })
      .where(eq(notificationJob.id, job.id));
    return "dead";
  }

  await db
    .update(notificationJob)
    .set({
      status: "pending",
      lastError: message,
      runAfter: new Date(Date.now() + backoffMs(job.attempts)),
    })
    .where(eq(notificationJob.id, job.id));
  return "retrying";
}

/** Exponential backoff, capped. `attempts` is 1-based here (the claim has
 * already counted this try), so the first retry waits `BACKOFF_BASE_MS`. */
export function backoffMs(attempts: number): number {
  const delay = BACKOFF_BASE_MS * 2 ** Math.max(0, attempts - 1);
  return Math.min(delay, BACKOFF_MAX_MS);
}

/**
 * Returns jobs stuck in `processing` to the pending pool. A worker killed
 * mid-job (deploy, OOM, crash) leaves its claimed rows marked `processing`
 * with nothing running them; without this they would never be retried
 * despite the queue being durable.
 *
 * `olderThanMs` must comfortably exceed the longest a real job can take, or
 * this will resurrect jobs that are still in flight and deliver twice.
 */
export async function reclaimStalledJobs(olderThanMs: number): Promise<number> {
  const result = await db.execute<{ id: string }>(sql`
    UPDATE ${notificationJob}
    SET status = 'pending', updated_at = now()
    WHERE ${notificationJob.status} = 'processing'
      AND ${notificationJob.updatedAt} < now() - ${`${olderThanMs} milliseconds`}::interval
    RETURNING id
  `);
  return result.rows.length;
}
