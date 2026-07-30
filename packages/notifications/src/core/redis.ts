import { env } from "@mumzo/env/server";
import IORedis from "ioredis";

/** BullMQ requires `maxRetriesPerRequest: null` on the connection it's given —
 * without it, ioredis gives up retrying during a Redis restart and BullMQ's
 * own reconnect logic never gets the chance to take over. */
export function createRedisConnection() {
  return new IORedis(env.REDIS_URL, { maxRetriesPerRequest: null });
}
