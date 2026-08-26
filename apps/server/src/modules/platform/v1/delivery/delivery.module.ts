import { createRouter } from "@/core";
import { completeRoute, statusRoute, unlockRoute } from "./delivery.routes";
import {
  completeDeliveryRun,
  getDeliveryLinkStatus,
  unlockDeliveryLink,
} from "./delivery.service";

/**
 * Public rider link. Intentionally *not* behind `requireAuth` — riders are not
 * app users. Authorisation is the rider's access code, checked per request in
 * the service; there is no session, so every call carries the code.
 */

const app = createRouter();

const delivery = app
  .openapi(statusRoute, async (c) => {
    const data = await getDeliveryLinkStatus(c.req.valid("param").token);
    return c.json({ success: true as const, data }, 200);
  })
  .openapi(unlockRoute, async (c) => {
    const data = await unlockDeliveryLink(
      c.req.valid("param").token,
      c.req.valid("json").code,
    );
    return c.json({ success: true as const, data }, 200);
  })
  .openapi(completeRoute, async (c) => {
    const { code, outcome, reason } = c.req.valid("json");
    const data = await completeDeliveryRun(
      c.req.valid("param").token,
      code,
      outcome,
      reason,
    );
    return c.json({ success: true as const, data }, 200);
  });

export default delivery;
