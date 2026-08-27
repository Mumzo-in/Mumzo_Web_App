import { z } from "zod";

import { defineTemplate } from "./registry";

const dataSchema = z.object({
  orderId: z.string(),
  /** Status the order was in when it was cancelled — "confirmed" and
   * "packed" mean very different amounts of wasted work. */
  fromStatus: z.string(),
  reason: z.string().nullable(),
});

/**
 * Staff-facing cancellation alert.
 *
 * Distinct from `admin.order.status_updated` rather than riding on it: a
 * cancellation needs someone to *stop packing now*, and reading as one more
 * "confirmed → cancelled" hop in a list of routine transitions is how that
 * gets missed. It also carries its own collapse key, so it can't be
 * swallowed by an unrelated status update for the same order.
 */
export const adminOrderCancelledTemplate = defineTemplate({
  id: "admin.order.cancelled",
  dataSchema,
  render: (data) => ({
    title: "Order cancelled",
    body: data.reason
      ? `#${data.orderId.slice(0, 8)} cancelled from "${data.fromStatus}" — ${data.reason}`
      : `#${data.orderId.slice(0, 8)} cancelled by the customer from "${data.fromStatus}".`,
    deeplink: `/orders/${data.orderId}`,
    data: {
      templateId: "admin.order.cancelled",
      orderId: data.orderId,
      fromStatus: data.fromStatus,
      reason: data.reason ?? "",
    },
  }),
});
