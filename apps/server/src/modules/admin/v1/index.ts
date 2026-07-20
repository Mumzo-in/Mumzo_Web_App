import { createRoute, z } from "@hono/zod-openapi";

import {
  authErrorResponses,
  createRouter,
  jsonContent,
  requireAuth,
  successSchema,
} from "@/core";

/**
 * Admin API v1 — the staff surface. Mounted at `/api/v1/admin`.
 *
 * Guards apply to the whole subtree here rather than per-route, so a newly
 * added admin router cannot accidentally ship unauthenticated.
 *
 * Only authentication is enforced today — any signed-in user reaches these
 * routes. Role gating needs Better Auth's admin plugin and a `role` column,
 * neither of which exists yet (`plugins: []`); `STAFF_ROLES` in
 * `core/constants/roles.ts` holds the intended set. Add the check before any
 * real admin endpoint ships.
 */

const pingRoute = createRoute({
  method: "get",
  path: "/ping",
  tags: ["Admin"],
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

// Registered separately, not chained: `.use()` on OpenAPIHono returns a plain
// Hono, which drops the `.openapi()` method from the type.
app.use(requireAuth);

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
