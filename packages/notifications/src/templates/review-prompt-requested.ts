import { z } from "zod";

import { defineTemplate } from "./registry";

const dataSchema = z.object({
  orderId: z.string(),
});

/** Fired the moment an order is marked delivered — asks the shopper to
 * rate the order. A rating of 3+ leads into the referral nudge next. */
export const reviewPromptRequestedTemplate = defineTemplate({
  id: "review.prompt_requested",
  dataSchema,
  render: (data) => ({
    title: "How was your order?",
    body: "Rate your recent order and help other parents shop with confidence.",
    deeplink: `/orders/${data.orderId}`,
    data: { orderId: data.orderId },
  }),
});
