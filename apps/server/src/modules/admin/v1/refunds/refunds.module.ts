import { createRouter, requirePermission } from "@/core";
import { listRoute } from "./refunds.routes";
import { listRefunds } from "./refunds.service";

/** Read-only refunds list, filterable by status — backs the dashboard's
 * "Pending refunds" attention link. */

const app = createRouter();

app.use("/*", requirePermission("report", "read"));

const refunds = app.openapi(listRoute, async (c) => {
  const { status } = c.req.valid("query");
  return c.json(
    { success: true as const, data: await listRefunds({ status }) },
    200,
  );
});

export default refunds;
