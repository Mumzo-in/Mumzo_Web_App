import { createRoute, z } from "@hono/zod-openapi";
import { checkDbConnection, pool } from "@mumzo/db";
import {
  startNotificationWorker,
  startRetentionSweep,
} from "@mumzo/notifications";
import { websocket } from "@mumzo/realtime/bun";

import {
  commonErrorResponses,
  createApp,
  jsonContent,
  mountOpenAPI,
  successSchema,
} from "./core";
import referralSharePage from "./modules/platform/v1/referrals/referral-share-page";
import { startReferralSettlementSweep } from "./modules/platform/v1/referrals/referrals.sweep";
import { startReviewPromptSweep } from "./modules/platform/v1/reviews/reviews.sweep";
import router from "./router";

const app = createApp();

// In-process notification worker — same Bun process as the API, per the
// architecture doc (docs/infra/notifications-architecture.md). Closed
// alongside the DB pool on shutdown so an in-flight send isn't abandoned.
const notificationWorker = startNotificationWorker();

// Trims `notification_job`: without it the queue table grows without bound,
// since the table *is* the queue now and nothing prunes it automatically the
// way BullMQ did. Completed jobs are kept 7 days, dead ones 30.
const retentionSweep = startRetentionSweep();

// In-process referral settlement sweep — see referrals.sweep.ts. Same
// lifecycle as the notification worker: closed on shutdown so an in-flight
// sweep isn't abandoned mid-batch.
const referralSweep = startReferralSettlementSweep();

// In-process review-prompt sweep — see reviews.sweep.ts. Same lifecycle.
const reviewPromptSweep = startReviewPromptSweep();

async function shutdown(signal: string) {
  console.log(`[server] ${signal} received, shutting down...`);
  await notificationWorker.close();
  retentionSweep.close();
  referralSweep.close();
  reviewPromptSweep.close();
  await pool.end();
  process.exit(0);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

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

// Crawler-facing share page — see referral-share-page.ts for why this can't
// just live in the SPA. Mounted outside /api/v1 to match the public
// `/r/:code` path real users and link previews actually hit.
app.route("/r", referralSharePage);

app.route("/", router);

// /openapi.json + /reference. Must come after routes are mounted — the spec
// is generated from what is registered at call time.
mountOpenAPI(app);

export type AppType = typeof router;

// Bun's implicit-serve form only starts a WebSocket-capable server when the
// default export carries a `websocket` handler alongside `fetch` — a plain
// Hono instance (which only exposes `fetch`) isn't enough. See
// docs/infra/realtime-architecture.md for the upgrade flow this enables.
export default { fetch: app.fetch, websocket };
