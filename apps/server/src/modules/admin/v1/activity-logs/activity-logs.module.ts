import { createRouter, requirePermission } from "@/core";
import { listRoute } from "./activity-logs.routes";
import { listActivityLogs } from "./activity-logs.service";

const app = createRouter();

// Guard route to require activityLog:read permission
app.use("/*", requirePermission("activityLog", "read"));

const activityLogs = app.openapi(listRoute, async (c) => {
  const query = c.req.valid("query");
  const { data, meta } = await listActivityLogs(query);
  return c.json({ success: true as const, data: { data, meta } }, 200);
});

export default activityLogs;
