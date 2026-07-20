import type { Hook } from "@hono/zod-openapi";
import { OpenAPIHono } from "@hono/zod-openapi";
import { env } from "@mumzo/env/server";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

import { ERROR_CODES } from "./constants";
import { errorHandler, formatZodError, notFoundHandler } from "./errors";
import { globalRateLimit, requestId } from "./middleware";
import type { AppEnv } from "./types";

/**
 * Runs on every `createRoute` validation failure. Without it, `@hono/
 * zod-openapi` returns its own error shape and the envelope contract breaks
 * the moment a client sends a bad body.
 *
 * Typed loosely because the hook is called for every route with a different
 * inferred schema; narrowing it here would fight the library's generics for
 * no benefit.
 */
export const defaultHook: Hook<unknown, AppEnv, string, unknown> = (
  result,
  c,
) => {
  if (!result.success) {
    return c.json(
      {
        success: false as const,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: formatZodError(result.error),
        },
      },
      422,
    );
  }
};

/**
 * A sub-router. Use for every feature module:
 *
 *   const products = createRouter().openapi(listRoute, handler);
 *
 * It carries the same `AppEnv` typing and validation hook as the root app, so
 * `c.var.user` is typed and validation errors come back in the envelope no
 * matter where the route lives.
 */
export function createRouter() {
  return new OpenAPIHono<AppEnv>({ defaultHook });
}

/**
 * The root application: middleware stack, error handling, 404.
 *
 * Kept separate from route mounting (see `router.ts`) so this file owns
 * "how requests are processed" and that one owns "what paths exist".
 */
export function createApp() {
  const app = createRouter();

  // Order matters. requestId first so every log line and error carries it;
  // rate limiting before CORS and routing so rejected requests cost as little
  // as possible.
  app.use(requestId);
  app.use(logger());
  app.use(globalRateLimit);
  app.use(
    "/*",
    cors({
      // A list — the storefront (3001) and admin panel (3002) are separate
      // origins. Hono echoes back whichever one matches the request.
      origin: env.CORS_ORIGIN,
      allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
      allowHeaders: ["Content-Type", "Authorization"],
      credentials: true,
    }),
  );

  app.onError(errorHandler);
  app.notFound(notFoundHandler);

  return app;
}
