import { hub, ROOMS } from "@mumzo/realtime";
import { upgradeWebSocket } from "@mumzo/realtime/bun";
import type { WSContext } from "hono/ws";

import { createRouter, requireStaffAuth } from "@/core";
import { unauthorized } from "@/core/errors";

/**
 * Admin live feed — one room today (`admin:orders`), joined unconditionally
 * on connect. A client that wants to subscribe to more rooms later (e.g.
 * per-hub scoping) would send a `{ type: "subscribe", room }` message; the
 * `onMessage` hook below is the extension point for that, currently unused.
 */
const app = createRouter();

app.use("/*", requireStaffAuth);

app.get(
  "/",
  upgradeWebSocket((c) => {
    const staffUser = c.get("user");
    if (!staffUser) {
      console.warn("[admin-ws] upgrade rejected — no authenticated staff user");
      throw unauthorized();
    }
    console.info(`[admin-ws] upgrade accepted for staff ${staffUser.id}`);

    let connection: ReturnType<typeof hub.onOpen> | undefined;

    return {
      onOpen(_event, ws: WSContext) {
        connection = hub.onOpen(
          ws,
          { kind: "staff", staffUserId: staffUser.id },
          [ROOMS.adminOrders],
        );
        console.info(
          `[admin-ws] connection opened for staff ${staffUser.id}, joined rooms: ${ROOMS.adminOrders}`,
        );
      },
      onClose() {
        console.info(`[admin-ws] connection closed for staff ${staffUser.id}`);
        if (connection) {
          hub.onClose(connection);
        }
      },
    };
  }),
);

export default app;
