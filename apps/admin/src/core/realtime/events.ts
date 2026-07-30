/**
 * Wire event shapes — mirrors `packages/realtime/src/events/orders.ts`'s
 * `dataSchema`s by hand rather than importing them. `@mumzo/realtime` is a
 * server-side package (Bun/Node `hono/bun` WS glue); pulling it into the
 * Vite bundle would drag that in for no reason. If the two drift, a bad
 * payload just fails `JSON.parse`/narrowing below — same failure mode as
 * any other API contract between apps.
 */
export type OrderCreatedEvent = {
  type: "order.created";
  data: {
    orderId: string;
    hubId: string;
    total: number;
    addressName: string;
  };
  emittedAt: string;
};

export type OrderStatusUpdatedEvent = {
  type: "order.status_updated";
  data: {
    orderId: string;
    fromStatus: string;
    toStatus: string;
  };
  emittedAt: string;
};

export type AdminRealtimeEvent = OrderCreatedEvent | OrderStatusUpdatedEvent;

export function isAdminRealtimeEvent(
  value: unknown,
): value is AdminRealtimeEvent {
  return (
    typeof value === "object" &&
    value !== null &&
    "type" in value &&
    "data" in value &&
    "emittedAt" in value
  );
}
