import { Queue } from "bullmq";

import { createRedisConnection } from "./redis";
import type { NotificationJobPayload } from "./types";

export const NOTIFICATION_QUEUE_NAME = "notifications";

let queue: Queue<NotificationJobPayload> | undefined;

/** Lazily created singleton — the queue only needs a Redis connection once
 * something actually calls `notify.send()`, not at module import time. */
export function getNotificationQueue() {
  if (!queue) {
    queue = new Queue<NotificationJobPayload>(NOTIFICATION_QUEUE_NAME, {
      connection: createRedisConnection(),
      defaultJobOptions: {
        attempts: 5,
        backoff: { type: "exponential", delay: 5_000 },
        removeOnComplete: { age: 60 * 60 * 24 * 7 }, // 7 days
        removeOnFail: { age: 60 * 60 * 24 * 30 }, // 30 days
      },
    });
  }
  return queue;
}
