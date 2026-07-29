import { createRoute, z } from "@hono/zod-openapi";

import {
  authErrorResponses,
  createRouter,
  jsonContent,
  requirePermission,
  successSchema,
} from "@/core";
import { recentUserSchema, userCountsSchema } from "./schema";
import { recentUsers, userCounts } from "./service";

const TAG = "Admin | Dashboard";

const userCountsRoute = createRoute({
  method: "get",
  path: "/user-counts",
  tags: [TAG],
  summary: "Total customers and new signups in the trailing 24h",
  security: [{ cookieAuth: [] }],
  responses: {
    200: jsonContent(successSchema(userCountsSchema), "User counts"),
    ...authErrorResponses,
  },
});

const recentUsersRoute = createRoute({
  method: "get",
  path: "/recent-users",
  tags: [TAG],
  summary: "Most recently registered customers",
  security: [{ cookieAuth: [] }],
  responses: {
    200: jsonContent(
      successSchema(z.array(recentUserSchema)),
      "Recent customers",
    ),
    ...authErrorResponses,
  },
});

const app = createRouter();

app.use("/*", requirePermission("report", "read"));

const dashboard = app
  .openapi(userCountsRoute, async (c) =>
    c.json({ success: true as const, data: await userCounts() }, 200),
  )
  .openapi(recentUsersRoute, async (c) =>
    c.json({ success: true as const, data: await recentUsers() }, 200),
  );

export default dashboard;
