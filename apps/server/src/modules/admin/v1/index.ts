import { createRoute, z } from "@hono/zod-openapi";

import {
  authErrorResponses,
  createRouter,
  jsonContent,
  requireStaffAuth,
  successSchema,
} from "@/core";

import authRoutes from "./auth";

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

// Guard everything, then carve out `/auth/*`. Written this way round on
// purpose: a new admin route is protected by default, and forgetting to add
// it to a list cannot silently expose it. Only the sign-in endpoints — which
// by definition cannot require a session — are exempt.
//
// Registered separately, not chained: `.use()` on OpenAPIHono returns a plain
// Hono, which drops the `.openapi()` method from the type.
app.use("/*", async (c, next) => {
  if (c.req.path.includes("/admin/auth/")) {
    return next();
  }

  return requireStaffAuth(c, next);
});

app.route("/auth", authRoutes);

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
