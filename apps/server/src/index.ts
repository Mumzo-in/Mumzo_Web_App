import { createRoute, z } from "@hono/zod-openapi";
import { auth } from "@mumzo/auth";
import { checkDbConnection } from "@mumzo/db";

import {
  authRateLimit,
  commonErrorResponses,
  createApp,
  jsonContent,
  mountOpenAPI,
  successSchema,
} from "./core";
import router from "./router";

const app = createApp();

// Better Auth owns its own routing — mounted before the API router and never
// wrapped by it. Excluded from the OpenAPI spec because Better Auth defines
// its own surface.
//
// The tighter limit sits in front: sign-in and OTP endpoints are the most
// abused surface on a consumer app, and each OTP send costs real money.
app.use("/api/auth/*", authRateLimit);
app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw));

// Liveness. Plain text at "/" because the Docker healthcheck greps it.
app.get("/", (c) => c.text("OK"));

const healthRoute = createRoute({
  method: "get",
  path: "/health",
  tags: ["Health"],
  summary: "Readiness — verifies the database is reachable",
  responses: {
    200: jsonContent(
      successSchema(
        z.object({
          status: z.enum(["ok", "degraded"]),
          database: z.boolean(),
        }),
      ),
      "Service status",
    ),
    ...commonErrorResponses,
  },
});

app.openapi(healthRoute, async (c) => {
  const database = await checkDbConnection().catch(() => false);

  return c.json(
    {
      success: true as const,
      data: {
        status: database ? ("ok" as const) : ("degraded" as const),
        database,
      },
    },
    200,
  );
});

app.route("/", router);

// /openapi.json + /reference. Must come after routes are mounted — the spec
// is generated from what is registered at call time.
mountOpenAPI(app);

export type AppType = typeof router;

export default app;
