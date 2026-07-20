import { createMiddleware } from "hono/factory";

import type { AppEnv } from "@/core/types";

/**
 * Correlation id — every log line and error response carries it.
 *
 * An inbound `x-request-id` is honoured so a trace survives across services
 * (Cloudflare, a future worker) rather than restarting at our edge.
 */
export const requestId = createMiddleware<AppEnv>(async (c, next) => {
  const incoming = c.req.header("x-request-id");
  const id = incoming ?? crypto.randomUUID();

  c.set("requestId", id);
  c.header("x-request-id", id);

  await next();
});
