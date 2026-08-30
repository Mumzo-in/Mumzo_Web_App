import { z } from "zod";

import { whatsappRender } from "../channels/whatsapp/render";
import type { WhatsAppTemplateKey } from "../channels/whatsapp/templates";
import { defineTemplate } from "./registry";

const dataSchema = z.object({
  orderId: z.string(),
  status: z.string(),
  /** Customer's first name, for the WhatsApp greeting. Optional so
   * existing push-only call sites keep working unchanged. */
  customerName: z.string().optional(),
  /** Set on terminal statuses that WhatsApp templates render — a
   * cancellation reason, a delivery time, or a failure cause. */
  detail: z.string().optional(),
  /** Rider's name, resolved by the order service when a delivery is
   * assigned. Only `out_for_delivery` renders it. */
  riderName: z.string().optional(),
});

type Data = z.infer<typeof dataSchema>;

/**
 * Which WhatsApp template each order status maps to.
 *
 * Statuses absent from this map get no WhatsApp message at all, which is
 * deliberate:
 *
 * - `pending_payment` — COD only today, so there is nothing to chase.
 * - `shipped` — indistinguishable from `out_for_delivery` in a 10-minute
 *   delivery; two messages minutes apart is how people mute a business.
 * - `return_requested` / `returned` — handled by the return templates,
 *   which carry pickup and refund detail this payload doesn't have.
 *
 * `confirmed` is absent too, but for a different reason: it has its own
 * template (`order.confirmed`), fired at order creation where the cart
 * contents still exist.
 */
const STATUS_TO_WHATSAPP: Partial<Record<string, WhatsAppTemplateKey>> = {
  packed: "ORDER_PACKED",
  out_for_delivery: "ORDER_OUT_FOR_DELIVERY",
  delivered: "ORDER_DELIVERED",
  cancelled: "ORDER_CANCELLED",
};

/** Short order reference shown to customers — the full uuid is unreadable
 * in a message and means nothing to them. */
function shortId(orderId: string): string {
  return orderId.slice(0, 8).toUpperCase();
}

/**
 * Builds the parameters for whichever template the status maps to.
 *
 * Each template takes a different parameter set, so this switch is the one
 * place the two catalogues meet. Every value is non-empty by
 * construction — Meta rejects blank parameters at send time, so a missing
 * optional falls back to neutral copy rather than an empty string.
 */
function renderWhatsApp(data: Data) {
  const key = STATUS_TO_WHATSAPP[data.status];
  if (!key) return undefined;

  const id = shortId(data.orderId);
  const name = data.customerName?.trim() || "there";

  // Templates with a dynamic URL button need its parameter too: Meta
  // rejects the send outright (131008) when a `{{1}}` button is left
  // unfilled. The full uuid goes in the link even though the body shows
  // the short id — the link has to actually resolve.
  const buttonParams = [data.orderId];

  switch (key) {
    case "ORDER_PACKED":
      return whatsappRender(
        "ORDER_PACKED",
        { customerName: name, orderId: id },
        { buttonParams },
      );

    case "ORDER_DELIVERED":
      return whatsappRender(
        "ORDER_DELIVERED",
        { orderId: id, deliveredAt: data.detail?.trim() || "just now" },
        { buttonParams },
      );

    case "ORDER_CANCELLED":
      return whatsappRender("ORDER_CANCELLED", {
        orderId: id,
        // Sits mid-sentence in the approved copy, so it must never be
        // blank — Meta rejects empty parameters outright.
        reason: data.detail?.trim() || "No reason was given.",
      });

    case "ORDER_OUT_FOR_DELIVERY":
      return whatsappRender(
        "ORDER_OUT_FOR_DELIVERY",
        {
          customerName: name,
          orderId: id,
          // Falls back rather than skipping the message: knowing a rider
          // is on the way still beats silence, and an empty parameter
          // would be rejected outright.
          riderName: data.riderName?.trim() || "Your rider",
          // No live ETA source yet — the promise the storefront makes is
          // ten minutes, so the message matches it.
          etaMinutes: "10",
        },
        { buttonParams },
      );

    // Needs items/total/address, which this payload doesn't carry — the
    // confirmation send is raised from the order service, where the cart
    // is still in hand.
    default:
      return undefined;
  }
}

export const orderStatusUpdatedTemplate = defineTemplate({
  id: "order.status_updated",
  dataSchema,
  render: (data) => ({
    title: "Order update",
    body: `Your order #${data.orderId.slice(0, 8)} is now "${data.status}".`,
    deeplink: `/orders/${data.orderId}`,
    data: { orderId: data.orderId, status: data.status },
  }),
  renderForChannel: {
    whatsapp: (data) =>
      renderWhatsApp(data) ?? {
        // No WhatsApp mapping for this status. The adapter refuses this
        // permanently rather than retrying, and the log names the status.
        title: "order.status_updated",
        body: `No WhatsApp template for status "${data.status}"`,
        data: { orderId: data.orderId, status: data.status },
      },
  },
});
