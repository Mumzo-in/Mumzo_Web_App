/** Admin order views — api-plan §15d. Mirrors the real order lifecycle in
 * packages/db/src/schema/commerce.ts / docs/order-checkout-flow.md, the same
 * 9-status set the customer-facing app already renders. */

export type OrderStatus =
  | "pending_payment"
  | "confirmed"
  | "packed"
  | "shipped"
  | "out_for_delivery"
  | "delivered"
  | "cancelled"
  | "return_requested"
  | "returned";

export type AdminOrderSummary = {
  id: string;
  status: OrderStatus;
  customerName: string;
  hubName: string;
  itemCount: number;
  total: number;
  paymentMethod: string;
  placedAt: string;
};

export type AdminOrderItem = {
  id: string;
  productId: string;
  name: string;
  variantLabel: string | null;
  price: number;
  qty: number;
};

export type AdminOrderStatusLogEntry = {
  id: string;
  fromStatus: OrderStatus | null;
  toStatus: OrderStatus;
  actor: string;
  note: string | null;
  createdAt: string;
};

export type AdminOrderDetail = {
  id: string;
  status: OrderStatus;
  customerId: string;
  customerName: string;
  hubName: string;
  addressLabel: string;
  addressName: string;
  addressPhone: string;
  addressLine1: string;
  addressLine2: string;
  addressLandmark: string | null;
  addressPincode: string;
  addressCity: string;
  subtotal: number;
  gstAmount: number;
  deliveryFee: number;
  discount: number;
  total: number;
  paymentMethod: string;
  paymentStatus: string;
  items: AdminOrderItem[];
  statusLog: AdminOrderStatusLogEntry[];
  placedAt: string;
};

export const ORDER_STATUS_META: Record<
  OrderStatus,
  { label: string; tint: string }
> = {
  pending_payment: {
    label: "Order placed",
    tint: "bg-accent text-accent-foreground",
  },
  confirmed: {
    label: "Order placed",
    tint: "bg-accent text-accent-foreground",
  },
  packed: { label: "Packed", tint: "bg-cream text-ink" },
  shipped: { label: "Shipped", tint: "bg-cream text-ink" },
  out_for_delivery: {
    label: "Out for delivery",
    tint: "bg-primary/10 text-primary",
  },
  delivered: { label: "Delivered", tint: "bg-sage text-ink" },
  cancelled: {
    label: "Cancelled",
    tint: "bg-destructive/10 text-destructive",
  },
  return_requested: {
    label: "Return requested",
    tint: "bg-destructive/10 text-destructive",
  },
  returned: { label: "Returned", tint: "bg-destructive/10 text-destructive" },
};

/** Display ordering for the happy-path fulfilment timeline — terminal/side
 * states (cancelled/return_requested/returned) are rendered separately. */
export const ORDER_FLOW: OrderStatus[] = [
  "confirmed",
  "packed",
  "shipped",
  "out_for_delivery",
  "delivered",
];

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  upi: "UPI",
  card: "Card",
  netbanking: "Netbanking",
  cod: "Cash on delivery",
  wallet: "Wallet",
};

/**
 * True when an in-flight order has passed its promised time. Real orders
 * don't carry a per-order SLA timestamp yet (no dispatch/ETA tracking table),
 * so this always reports false until that lands — kept as a stub so
 * `OrderTable`/detail page call sites don't need to change again later.
 */
export function isSlaBreached(_order: AdminOrderSummary | AdminOrderDetail) {
  return false;
}
