import { createRoute, z } from "@hono/zod-openapi";
import { checkDbConnection } from "@mumzo/db";

import {
  commonErrorResponses,
  createApp,
  jsonContent,
  mountOpenAPI,
  successSchema,
} from "./core";
import router from "./router";

const app = createApp();

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
