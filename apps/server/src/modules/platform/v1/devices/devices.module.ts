import { createRouter, requireAuth } from "@/core";
import { unauthorized } from "@/core/errors";
import { registerDeviceRoute, unregisterDeviceRoute } from "./devices.routes";
import { registerDevice, unregisterDevice } from "./devices.service";

/** Push-notification device registration — always behind auth. There is no
 * anonymous FCM/web-push init; a client only calls this after sign-in. */

const app = createRouter();

app.use("/*", requireAuth);

const devices = app
  .openapi(registerDeviceRoute, async (c) => {
    const authUser = c.get("user");
    if (!authUser) throw unauthorized();
    const data = await registerDevice(authUser.id, c.req.valid("json"));
    return c.json({ success: true as const, data }, 200);
  })
  .openapi(unregisterDeviceRoute, async (c) => {
    const authUser = c.get("user");
    if (!authUser) throw unauthorized();
    const id = c.req.valid("param").id;
    await unregisterDevice(authUser.id, id);
    return c.json({ success: true as const, data: { id } }, 200);
  });

export default devices;
