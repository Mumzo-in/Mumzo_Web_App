import { z } from "zod";

import { defineTemplate } from "./registry";

const dataSchema = z.object({
  orderId: z.string(),
  status: z.string(),
});

export const orderStatusUpdatedTemplate = defineTemplate({
  id: "order.status_updated",
  dataSchema,
  render: (data) => ({
    title: "Order update",
    body: `Your order #${data.orderId.slice(0, 8)} is now "${data.status}".`,
    deeplink: `/orders/${data.orderId}`,
    data: { orderId: data.orderId, status: data.status },
  }),
});
