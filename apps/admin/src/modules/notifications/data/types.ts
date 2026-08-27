/**
 * One received notification, kept client-side for the bell/panel. Not
 * persisted — a page refresh clears history, same as any other in-memory
 * notification tray.
 *
 * A discriminated union rather than one wide shape: a delivery outcome has
 * no `total` or `addressName`, and modelling it as optional fields would
 * let the card render "₹undefined" for kinds that never carry them.
 */
export type OrderNotification = {
  id: string;
  orderId: string;
  receivedAt: string;
  read: boolean;
} & (
  | {
      kind: "order.created";
      hubId: string;
      total: number;
      addressName: string;
    }
  | {
      kind: "order.status_updated";
      fromStatus: string;
      toStatus: string;
    }
  | {
      kind: "delivery.completed";
      outcome: string;
      /** Present when the copy came from the notification itself. */
      detail: string;
    }
  | {
      kind: "order.cancelled";
      /** What the order was doing when it was cancelled — "packed" means
       * work already done, "confirmed" means none. */
      fromStatus: string;
      reason: string;
    }
);

export type NotificationKind = OrderNotification["kind"];
