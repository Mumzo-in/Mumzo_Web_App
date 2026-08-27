import { z } from "zod";

import { defineTemplate } from "./registry";

const dataSchema = z.object({
  orderId: z.string(),
  fromStatus: z.string(),
  toStatus: z.string(),
});

/**
 * Staff-facing counterpart to `order.status_updated`, which is written for
 * the customer ("Your order is now…"). Same event, different audience and
 * therefore different copy — staff need the transition, not reassurance.
 *
 * Carries `orderId` in `data` so the FCM adapter derives a collapse key
 * from it: an order walking through five statuses replaces its own tray
 * entry rather than stacking five.
 */
export const adminOrderStatusUpdatedTemplate = defineTemplate({
  id: "admin.order.status_updated",
  dataSchema,
  render: (data) => ({
    title: "Order updated",
    body: `#${data.orderId.slice(0, 8)} — ${data.fromStatus} → ${data.toStatus}`,
    deeplink: `/orders/${data.orderId}`,
    data: {
      templateId: "admin.order.status_updated",
      orderId: data.orderId,
      fromStatus: data.fromStatus,
      toStatus: data.toStatus,
    },
  }),
});
