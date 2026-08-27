import { z } from "zod";

import { defineTemplate } from "./registry";

const dataSchema = z.object({
  orderId: z.string(),
  outcome: z.string(),
  riderName: z.string().nullable(),
  reason: z.string().nullable(),
});

/**
 * Staff-facing delivery outcome. Previously this event reached the
 * dashboard only over the websocket feed; with that removed, FCM is the
 * sole path, so it needs a template of its own.
 *
 * A failed delivery is the case that actually matters — it needs somebody
 * to act — so the reason is surfaced in the body rather than requiring a
 * tap through to the order.
 */
export const adminDeliveryCompletedTemplate = defineTemplate({
  id: "admin.delivery.completed",
  dataSchema,
  render: (data) => {
    const rider = data.riderName ?? "Rider";
    const short = data.orderId.slice(0, 8);

    return {
      title:
        data.outcome === "delivered" ? "Order delivered" : "Delivery failed",
      body:
        data.outcome === "delivered"
          ? `#${short} delivered by ${rider}.`
          : `#${short} — ${rider}: ${data.reason ?? "no reason given"}`,
      deeplink: `/orders/${data.orderId}`,
      data: {
        templateId: "admin.delivery.completed",
        orderId: data.orderId,
        outcome: data.outcome,
      },
    };
  },
});
