import { createRouter, requireStaffAuth } from "@/core";
import { unauthorized } from "@/core/errors";
import {
  listDevicesRoute,
  listLogsRoute,
  listTemplatesRoute,
  testSendRoute,
} from "./notifications.routes";
import {
  listDevices,
  listRecentLogs,
  listTemplateInfo,
  sendTestNotification,
} from "./notifications.service";

/**
 * Notification registry + playground.
 *
 * Read-only visibility into who can receive pushes, plus a test-send that
 * goes through the real queue and the real adapter — so a green result here
 * means the production path works, not that a mock returned true.
 */
const app = createRouter();

app.use("/*", requireStaffAuth);

const notifications = app
  .openapi(listDevicesRoute, async (c) => {
    const data = await listDevices(c.req.valid("query"));
    return c.json({ success: true as const, data }, 200);
  })
  .openapi(listTemplatesRoute, async (c) => {
    const { audience } = c.req.valid("query");
    return c.json(
      { success: true as const, data: listTemplateInfo(audience) },
      200,
    );
  })
  .openapi(testSendRoute, async (c) => {
    const staffUser = c.get("user");
    if (!staffUser) throw unauthorized();
    const data = await sendTestNotification(staffUser.id, c.req.valid("json"));
    return c.json({ success: true as const, data }, 200);
  })
  .openapi(listLogsRoute, async (c) => {
    const data = await listRecentLogs(c.req.valid("query").limit);
    return c.json({ success: true as const, data }, 200);
  });

export default notifications;
