import { Worker } from "bullmq";

import { processNotificationJob } from "./dispatcher";
import { NOTIFICATION_QUEUE_NAME } from "./queue";
import { createRedisConnection } from "./redis";
import type { NotificationJobPayload } from "./types";

/** Starts the in-process BullMQ worker. Call once on server boot; call
 * `.close()` on the returned worker during graceful shutdown so in-flight
 * jobs aren't abandoned mid-send. */
export function startNotificationWorker() {
  const worker = new Worker<NotificationJobPayload>(
    NOTIFICATION_QUEUE_NAME,
    async (job) => {
      await processNotificationJob(job.data);
    },
    {
      connection: createRedisConnection(),
      concurrency: 10,
    },
  );

  worker.on("failed", (job, error) => {
    console.error(
      `[notifications] job ${job?.id} failed after ${job?.attemptsMade} attempts:`,
      error,
    );
  });

  return worker;
}
