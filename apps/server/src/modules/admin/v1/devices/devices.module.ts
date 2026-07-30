import { createRouter, requireStaffAuth } from "@/core";
import { unauthorized } from "@/core/errors";
import {
  registerStaffDeviceRoute,
  unregisterStaffDeviceRoute,
} from "./devices.routes";
import { registerStaffDevice, unregisterStaffDevice } from "./devices.service";

/** Staff push-notification device registration. Complements the WS feed
 * (`../ws`) — see docs/infra/realtime-architecture.md for how the two
 * relate: WS is the live in-app channel, this is the "alert someone even
 * when the tab isn't focused" channel. */

const app = createRouter();

app.use("/*", requireStaffAuth);

const devices = app
  .openapi(registerStaffDeviceRoute, async (c) => {
    const staffUser = c.get("user");
    if (!staffUser) throw unauthorized();
    const data = await registerStaffDevice(staffUser.id, c.req.valid("json"));
    return c.json({ success: true as const, data }, 200);
  })
  .openapi(unregisterStaffDeviceRoute, async (c) => {
    const staffUser = c.get("user");
    if (!staffUser) throw unauthorized();
    const id = c.req.valid("param").id;
    await unregisterStaffDevice(staffUser.id, id);
    return c.json({ success: true as const, data: { id } }, 200);
  });

export default devices;
