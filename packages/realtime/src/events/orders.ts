import { z } from "zod";

import { defineEvent } from "../core/registry";

export const orderCreatedEvent = defineEvent({
  type: "order.created",
  dataSchema: z.object({
    orderId: z.string(),
    hubId: z.string(),
    total: z.number(),
    addressName: z.string(),
  }),
});

export const orderStatusUpdatedEvent = defineEvent({
  type: "order.status_updated",
  dataSchema: z.object({
    orderId: z.string(),
    fromStatus: z.string(),
    toStatus: z.string(),
  }),
});
