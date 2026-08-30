import { z } from "zod";

import { whatsappRender } from "../channels/whatsapp/render";
import { defineTemplate } from "./registry";

const dataSchema = z.object({
  orderId: z.string(),
  customerName: z.string(),
  /** Pre-formatted item summary — built at the call site, where the line
   * rows are already in hand. */
  items: z.string(),
  total: z.number(),
  address: z.string(),
});

/**
 * Customer-facing order confirmation.
 *
 * Separate from `order.status_updated` rather than another status branch:
 * confirmation is the one message that needs the cart contents, and those
 * exist only at the moment the order is written. Widening the shared
 * status schema with four fields that every other status leaves blank
 * would push the cost of this one message onto all of them.
 */
export const orderConfirmedTemplate = defineTemplate({
  id: "order.confirmed",
  dataSchema,
  render: (data) => ({
    title: "Order confirmed",
    body: `Order #${data.orderId.slice(0, 8)} — ₹${data.total}`,
    deeplink: `/orders/${data.orderId}`,
    data: {
      templateId: "order.confirmed",
      orderId: data.orderId,
      total: String(data.total),
    },
  }),
  renderForChannel: {
    whatsapp: (data) =>
      whatsappRender(
        "ORDER_CONFIRMED",
        {
          customerName: data.customerName,
          orderId: data.orderId.slice(0, 8).toUpperCase(),
          items: data.items,
          // The ₹ sign lives in the approved copy, so passing it here too
          // would render "₹₹1,249".
          total: data.total.toLocaleString("en-IN"),
          address: data.address,
        },
        // The body shows the short id, but the link has to resolve — so
        // the button carries the full uuid.
        { buttonParams: [data.orderId] },
      ),
  },
});
