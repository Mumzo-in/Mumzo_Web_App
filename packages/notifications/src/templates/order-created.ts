import { z } from "zod";

import { defineTemplate } from "./registry";

const dataSchema = z.object({
  orderId: z.string(),
  total: z.number(),
  addressName: z.string(),
});

/** Staff-facing — fired alongside the `order.created` realtime event
 * (`@mumzo/realtime`) so a staff member gets an OS-level push even when the
 * admin dashboard tab isn't focused. See
 * docs/infra/realtime-architecture.md for how the two channels relate. */
export const orderCreatedTemplate = defineTemplate({
  id: "order.created",
  dataSchema,
  render: (data) => ({
    title: "New order",
    body: `Order #${data.orderId.slice(0, 8)} — ₹${data.total} from ${data.addressName}`,
    deeplink: `/orders/${data.orderId}`,
    data: { orderId: data.orderId },
  }),
});
