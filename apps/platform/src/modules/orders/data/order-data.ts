import type { OrderStatus } from "../api/orders-api";

/** Display metadata for the real order state machine
 * (docs/order-checkout-flow.md §5). `pending_payment` and `confirmed` both
 * read as "Order placed" to the customer — the payment-gateway step is an
 * internal distinction, not a state a customer needs to reason about. */
export const STATUS_META: Record<OrderStatus, { label: string; tint: string }> =
  {
    pending_payment: { label: "Order placed", tint: "bg-accent/50 text-ink" },
    confirmed: { label: "Order placed", tint: "bg-accent/50 text-ink" },
    packed: { label: "Packed", tint: "bg-accent/50 text-ink" },
    shipped: { label: "Shipped", tint: "bg-primary/10 text-primary" },
    out_for_delivery: {
      label: "Out for delivery",
      tint: "bg-primary/10 text-primary",
    },
    delivered: { label: "Delivered", tint: "bg-sage/60 text-ink" },
    cancelled: {
      label: "Cancelled",
      tint: "bg-destructive/10 text-destructive",
    },
    return_requested: {
      label: "Return requested",
      tint: "bg-amber-100 text-amber-800",
    },
    returned: { label: "Returned", tint: "bg-sage/60 text-ink" },
  };

/** The customer-facing timeline collapses pending_payment/confirmed into
 * one step — showing both would look like two separate "placed" stages. */
export const ORDER_FLOW: OrderStatus[] = [
  "confirmed",
  "packed",
  "shipped",
  "out_for_delivery",
  "delivered",
];

export const formatOrderDate = (iso: string): string =>
  new Date(iso).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
