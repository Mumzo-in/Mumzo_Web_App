import { db } from "@mumzo/db";
import { notificationJob } from "@mumzo/db/schema/notifications";
import { and, desc, eq, lt, sql } from "drizzle-orm";

import { log } from "./log";

/**
 * Dead-letter inspection and recovery, plus the retention sweep.
 *
 * A job reaches `dead` only after exhausting `maxAttempts` (see
 * `failJob`), so everything here is about the after-the-fact question:
 * what failed, why, and should it run again now that the cause is fixed.
 */

/** How long completed jobs are kept. Mirrors the `removeOnComplete` window
 * of the BullMQ setup this replaced. */
const COMPLETED_RETENTION_MS = 7 * 24 * 60 * 60 * 1000;

/** How long dead jobs are kept — longer, because they are the ones
 * somebody may still need to investigate or replay. */
const DEAD_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;

/** How often the retention sweep runs. */
const RETENTION_INTERVAL_MS = 60 * 60 * 1000; // 1 hour

/** Rows deleted per statement, so a large backlog is cleared in bounded
 * chunks rather than one long-running DELETE holding locks. */
const RETENTION_BATCH_SIZE = 1_000;

/** Ceiling on chunks per run — leftovers wait for the next interval. */
const MAX_RETENTION_BATCHES = 50;

export type DeadJob = {
  id: string;
  templateId: string;
  userId: string;
  audience: string;
  attempts: number;
  lastError: string | null;
  createdAt: Date;
  updatedAt: Date;
};

/** Lists dead jobs, newest failure first. */
export async function listDeadJobs(
  options: { templateId?: string; limit?: number } = {},
): Promise<DeadJob[]> {
  const limit = options.limit ?? 100;

  const rows = await db
    .select({
      id: notificationJob.id,
      templateId: notificationJob.templateId,
      userId: notificationJob.userId,
      audience: notificationJob.audience,
      attempts: notificationJob.attempts,
      lastError: notificationJob.lastError,
      createdAt: notificationJob.createdAt,
      updatedAt: notificationJob.updatedAt,
    })
    .from(notificationJob)
    .where(
      options.templateId
        ? and(
            eq(notificationJob.status, "dead"),
            eq(notificationJob.templateId, options.templateId),
          )
        : eq(notificationJob.status, "dead"),
    )
    .orderBy(desc(notificationJob.updatedAt))
    .limit(limit);

  return rows;
}

/** Dead-job counts grouped by template — the fastest way to see whether a
 * spike is one broken template or a systemic failure. */
export async function countDeadJobsByTemplate(): Promise<
  { templateId: string; count: number }[]
> {
  const rows = await db
    .select({
      templateId: notificationJob.templateId,
      count: sql<number>`count(*)::int`,
    })
    .from(notificationJob)
    .where(eq(notificationJob.status, "dead"))
    .groupBy(notificationJob.templateId)
    .orderBy(desc(sql`count(*)`));

  return rows;
}

/**
 * Returns one dead job to the queue with a clean attempt budget.
 *
 * `runAfter` is reset to now so the retry is immediate — the operator
 * replaying a job has presumably just fixed whatever broke it, and making
 * them wait out a stale backoff would be pointless. Returns false when the
 * id doesn't exist or isn't actually dead, so a caller can't silently
 * "retry" a job that is still running.
 */
export async function retryJob(id: string): Promise<boolean> {
  const rows = await db
    .update(notificationJob)
    .set({
      status: "pending",
      attempts: 0,
      runAfter: new Date(),
      lastError: null,
    })
    .where(and(eq(notificationJob.id, id), eq(notificationJob.status, "dead")))
    .returning({ id: notificationJob.id });

  return rows.length > 0;
}

/**
 * Bulk replay — every dead job, or every dead job for one template.
 *
 * Scoping to a template is the common case: one channel or one bad payload
 * shape breaks, gets fixed, and only its jobs should be replayed.
 */
export async function retryDeadJobs(templateId?: string): Promise<number> {
  const rows = await db
    .update(notificationJob)
    .set({
      status: "pending",
      attempts: 0,
      runAfter: new Date(),
      lastError: null,
    })
    .where(
      templateId
        ? and(
            eq(notificationJob.status, "dead"),
            eq(notificationJob.templateId, templateId),
          )
        : eq(notificationJob.status, "dead"),
    )
    .returning({ id: notificationJob.id });

  return rows.length;
}

/** Permanently removes one dead job — for a job that should never run
 * again (a deleted user, a retired template). */
export async function discardJob(id: string): Promise<boolean> {
  const rows = await db
    .delete(notificationJob)
    .where(and(eq(notificationJob.id, id), eq(notificationJob.status, "dead")))
    .returning({ id: notificationJob.id });

  return rows.length > 0;
}

/** Deletes rows of one status past their retention window, in bounded
 * chunks. Returns how many were removed. */
async function pruneStatus(status: string, olderThanMs: number) {
  const cutoff = new Date(Date.now() - olderThanMs);
  let deleted = 0;

  for (let batch = 0; batch < MAX_RETENTION_BATCHES; batch++) {
    const rows = await db.execute<{ id: string }>(sql`
      DELETE FROM ${notificationJob}
      WHERE ${notificationJob.id} IN (
        SELECT ${notificationJob.id}
        FROM ${notificationJob}
        WHERE ${notificationJob.status} = ${status}
          AND ${notificationJob.createdAt} < ${cutoff}
        LIMIT ${RETENTION_BATCH_SIZE}
      )
      RETURNING id
    `);

    deleted += rows.rows.length;
    if (rows.rows.length < RETENTION_BATCH_SIZE) {
      break;
    }
  }

  return deleted;
}

/**
 * Trims the queue table. Without this `notification_job` grows without
 * bound — BullMQ pruned completed/failed jobs on its own, and that
 * behaviour has to be re-created now that the table *is* the queue.
 *
 * `failed` is swept on the completed schedule: it is a transient state a
 * job passes through, not a resting place (terminal failures are `dead`).
 */
export async function runRetentionSweep(): Promise<{
  completed: number;
  dead: number;
}> {
  const completed =
    (await pruneStatus("completed", COMPLETED_RETENTION_MS)) +
    (await pruneStatus("failed", COMPLETED_RETENTION_MS));
  const dead = await pruneStatus("dead", DEAD_RETENTION_MS);

  return { completed, dead };
}

/** Starts the hourly retention sweep. Mirrors the other in-process sweeps:
 * runs once at boot, and `close()` stops it on shutdown. */
export function startRetentionSweep() {
  function run() {
    runRetentionSweep()
      .then(({ completed, dead }) => {
        if (completed > 0 || dead > 0) {
          log.info({
            event: "retention.swept",
            completed,
            dead,
          });
        }
      })
      .catch((error) => {
        log.error({ event: "retention.failed", error });
      });
  }

  run();
  const timer = setInterval(run, RETENTION_INTERVAL_MS);

  return {
    close: () => {
      clearInterval(timer);
    },
  };
}

/** Queue health at a glance: how many jobs sit in each status, and how far
 * behind the oldest runnable job is. A growing `pending` count with a
 * rising age is the signal that the worker needs more concurrency or its
 * own process. */
export async function getQueueStats(): Promise<{
  byStatus: Record<string, number>;
  oldestPendingAgeMs: number | null;
}> {
  const rows = await db
    .select({
      status: notificationJob.status,
      count: sql<number>`count(*)::int`,
    })
    .from(notificationJob)
    .groupBy(notificationJob.status);

  const byStatus: Record<string, number> = {};
  for (const row of rows) {
    byStatus[row.status] = row.count;
  }

  const [oldest] = await db
    .select({ runAfter: notificationJob.runAfter })
    .from(notificationJob)
    .where(
      and(
        eq(notificationJob.status, "pending"),
        lt(notificationJob.runAfter, new Date()),
      ),
    )
    .orderBy(notificationJob.runAfter)
    .limit(1);

  return {
    byStatus,
    oldestPendingAgeMs: oldest ? Date.now() - oldest.runAfter.getTime() : null,
  };
}
