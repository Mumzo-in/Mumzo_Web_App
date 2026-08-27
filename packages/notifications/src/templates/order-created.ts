import { z } from "zod";

import { defineTemplate } from "./registry";

const dataSchema = z.object({
  orderId: z.string(),
  total: z.number(),
  addressName: z.string(),
  hubId: z.string().optional(),
});

/**
 * Staff-facing new-order alert. Since the admin websocket was removed this
 * is the *only* way a new order reaches the dashboard, so the payload
 * carries everything the panel's toast and notification tray render —
 * previously they read those fields off the realtime event.
 *
 * `data` values must be strings: FCM rejects a data payload containing
 * anything else, which is why `total` is stringified here rather than at
 * the call site.
 */
export const orderCreatedTemplate = defineTemplate({
  id: "order.created",
  dataSchema,
  render: (data) => ({
    title: "New order",
    body: `Order #${data.orderId.slice(0, 8)} — ₹${data.total} from ${data.addressName}`,
    deeplink: `/orders/${data.orderId}`,
    data: {
      templateId: "order.created",
      orderId: data.orderId,
      total: String(data.total),
      addressName: data.addressName,
      hubId: data.hubId ?? "",
    },
  }),
});
