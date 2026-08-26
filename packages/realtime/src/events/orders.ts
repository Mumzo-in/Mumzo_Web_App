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

/**
 * A rider closed out a delivery run from the public delivery link.
 *
 * Distinct from `order.status_updated` (which the admin panel also emits on
 * every staff-driven move) because it carries who reported it and why —
 * the things ops wants to see on a live board when the update did not come
 * from inside the panel. Both are published for a rider outcome, so existing
 * `order.status_updated` listeners keep working unchanged.
 */
export const deliveryCompletedEvent = defineEvent({
  type: "delivery.completed",
  dataSchema: z.object({
    orderId: z.string(),
    /** delivered | cancelled | returned */
    outcome: z.string(),
    riderId: z.string(),
    riderName: z.string().nullable(),
    reason: z.string().nullable(),
  }),
});
