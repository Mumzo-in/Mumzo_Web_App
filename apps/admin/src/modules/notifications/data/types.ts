/** One received `order.created` event, kept client-side for the bell/panel.
 * Not persisted — a page refresh clears history, same as any other
 * in-memory notification tray. */
export type OrderNotification = {
  id: string;
  orderId: string;
  hubId: string;
  total: number;
  addressName: string;
  receivedAt: string;
  read: boolean;
};
