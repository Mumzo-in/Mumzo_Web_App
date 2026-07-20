import type { OpenAPIHono } from "@hono/zod-openapi";
import { env } from "@mumzo/env/server";
import { Scalar } from "@scalar/hono-api-reference";

import { errorSchema } from "./response";
import type { AppEnv } from "./types";

/**
 * Reusable JSON response for `createRoute`.
 *
 *   responses: {
 *     200: jsonContent(successSchema(productSchema), "The product"),
 *     404: jsonContent(errorSchema, "Not found"),
 *   }
 */
export const jsonContent = <T>(schema: T, description: string) => ({
  content: { "application/json": { schema } },
  description,
});

/** The error responses nearly every route can return. Spread into `responses`. */
export const commonErrorResponses = {
  422: jsonContent(errorSchema, "Validation failed"),
  429: jsonContent(errorSchema, "Rate limit exceeded"),
  500: jsonContent(errorSchema, "Internal error"),
} as const;

/** Adds 401/403 — spread into any authenticated route. */
export const authErrorResponses = {
  401: jsonContent(errorSchema, "Not authenticated"),
  403: jsonContent(errorSchema, "Insufficient permissions"),
  ...commonErrorResponses,
} as const;

/**
 * Mounts the spec and the Scalar viewer:
 *
 *   /api/docs               interactive docs
 *   /api/docs/openapi.json  the spec
 *
 * **Development only.** Gated on `NODE_ENV === "development"` rather than
 * `!== "production"`, so neither staging nor a test runner exposes it — a
 * complete map of the API, admin routes included, is free reconnaissance for
 * anyone probing it.
 *
 * Because the routes are never registered outside development, both paths
 * fall through to the normal 404 and are indistinguishable from any other
 * unknown route.
 */
export function mountOpenAPI(app: OpenAPIHono<AppEnv>) {
  if (env.NODE_ENV !== "development") {
    return app;
  }

  app.doc("/api/docs/openapi.json", {
    openapi: "3.1.0",
    info: {
      version: "1.0.0",
      title: "Mumzo API",
      description:
        "Quick-commerce API for moms & babies.\n\n" +
        "All responses use a common envelope:\n" +
        "- Success: `{ success: true, data: T }`\n" +
        "- Lists: `{ success: true, data: { data: T[], meta: PageMeta } }`\n" +
        "- Error: `{ success: false, error: { code, message } }`",
    },
    servers: [{ url: env.BETTER_AUTH_URL, description: env.NODE_ENV }],
    tags: [
      { name: "Health", description: "Liveness and readiness" },
      { name: "Platform", description: "Customer storefront — /api/v1" },
      { name: "Admin", description: "Staff panel — /api/v1/admin" },
    ],
  });

  // Cookie-based sessions (Better Auth), so the scheme is apiKey-in-cookie
  // rather than a bearer token.
  app.openAPIRegistry.registerComponent("securitySchemes", "cookieAuth", {
    type: "apiKey",
    in: "cookie",
    name: "better-auth.session_token",
  });

  app.get(
    "/api/docs",
    Scalar({
      url: "/api/docs/openapi.json",
      pageTitle: "Mumzo API",
      theme: "default",
    }),
  );

  return app;
}
