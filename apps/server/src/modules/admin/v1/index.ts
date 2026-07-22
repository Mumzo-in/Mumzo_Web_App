import { createRoute, z } from "@hono/zod-openapi";

import {
  authErrorResponses,
  createRouter,
  jsonContent,
  requireStaffAuth,
  successSchema,
} from "@/core";

import { adminRoutes } from "./routes";

/**
 * Admin API v1 — the staff surface. Mounted at `/api/v1/admin`.
 *
 * Guards apply to the whole subtree here rather than per-route, so a newly
 * added admin router cannot accidentally ship unauthenticated.
 *
 * Authentication is enforced here; per-route authorization is applied with
 * `requirePermission(resource, action)` on each sub-router — see
 * `./roles` for the pattern.
 */

const pingRoute = createRoute({
  method: "get",
  path: "/ping",
  tags: ["Admin | Catalog"],
  summary: "Connectivity check",
  security: [{ cookieAuth: [] }],
  responses: {
    200: jsonContent(
      successSchema(
        z.object({
          pong: z.literal(true),
          surface: z.literal("admin"),
          version: z.literal("v1"),
        }),
      ),
      "Reachable",
    ),
    ...authErrorResponses,
  },
});

const app = createRouter();

/**
 * The sign-in endpoints, which by definition cannot require a session.
 *
 * Anchored with `startsWith`, not `includes`. A substring test would exempt
 * anything containing the segment anywhere in its path — a future route like
 * `/admin/products/admin/auth/x` would silently skip the guard.
 */
const AUTH_PREFIX = "/api/v1/admin/auth/";

const isAuthPath = (path: string) =>
  path === AUTH_PREFIX.slice(0, -1) || path.startsWith(AUTH_PREFIX);

// Guard everything, then carve out `/auth/*`. Written this way round on
// purpose: a new admin route is protected by default, and forgetting to add
// it to a list cannot silently expose it.
//
// Registered separately, not chained: `.use()` on OpenAPIHono returns a plain
// Hono, which drops the `.openapi()` method from the type.
app.use("/*", async (c, next) => {
  if (isAuthPath(c.req.path)) {
    return next();
  }

  return requireStaffAuth(c, next);
});

for (const { path, router } of adminRoutes) {
  app.route(path, router);
}

const v1 = app.openapi(pingRoute, (c) =>
  c.json(
    {
      success: true as const,
      data: {
        pong: true as const,
        surface: "admin" as const,
        version: "v1" as const,
      },
    },
    200,
  ),
);

export default v1;
