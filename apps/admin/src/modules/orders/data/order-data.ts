/** Admin order views — api-plan §15d. */

export type OrderStatus =
  | "placed"
  | "packed"
  | "out_for_delivery"
  | "delivered"
  | "cancelled";

export type PaymentMode = "upi" | "card" | "cod" | "wallet";

export type AdminOrder = {
  id: string;
  /** Short code operators actually say out loud. */
  reference: string;
  customerName: string;
  customerId: string;
  status: OrderStatus;
  paymentMode: PaymentMode;
  total: number;
  itemCount: number;
  hub: string;
  placedAt: string;
  /** Promised delivery time; drives the SLA chip. */
  slaDueAt: string;
};

export const ORDER_STATUS_META: Record<
  OrderStatus,
  { label: string; tint: string }
> = {
  placed: { label: "Placed", tint: "bg-accent text-accent-foreground" },
  packed: { label: "Packed", tint: "bg-cream text-ink" },
  out_for_delivery: {
    label: "Out for delivery",
    tint: "bg-primary/10 text-primary",
  },
  delivered: { label: "Delivered", tint: "bg-sage text-ink" },
  cancelled: {
    label: "Cancelled",
    tint: "bg-destructive/10 text-destructive",
  },
};

/** Forward-only status flow (api-plan §15d `PATCH /orders/:id/status`). */
export const ORDER_FLOW: OrderStatus[] = [
  "placed",
  "packed",
  "out_for_delivery",
  "delivered",
];

export const PAYMENT_MODE_LABELS: Record<PaymentMode, string> = {
  upi: "UPI",
  card: "Card",
  cod: "Cash on delivery",
  wallet: "Wallet",
};

export const orders: AdminOrder[] = [
  {
    id: "ord_10241",
    reference: "MZ-10241",
    customerName: "Ananya Reddy",
    customerId: "usr_001",
    status: "out_for_delivery",
    paymentMode: "upi",
    total: 1248,
    itemCount: 3,
    hub: "Jubilee Hills",
    placedAt: "2026-07-16T05:42:00.000Z",
    slaDueAt: "2026-07-16T05:52:00.000Z",
  },
  {
    id: "ord_10240",
    reference: "MZ-10240",
    customerName: "Priya Sharma",
    customerId: "usr_002",
    status: "placed",
    paymentMode: "cod",
    total: 649,
    itemCount: 1,
    hub: "Gachibowli",
    placedAt: "2026-07-16T05:38:00.000Z",
    slaDueAt: "2026-07-16T05:48:00.000Z",
  },
  {
    id: "ord_10239",
    reference: "MZ-10239",
    customerName: "Fatima Begum",
    customerId: "usr_003",
    status: "packed",
    paymentMode: "card",
    total: 2196,
    itemCount: 5,
    hub: "Jubilee Hills",
    placedAt: "2026-07-16T05:30:00.000Z",
    slaDueAt: "2026-07-16T05:40:00.000Z",
  },
  {
    id: "ord_10238",
    reference: "MZ-10238",
    customerName: "Sneha Iyer",
    customerId: "usr_004",
    status: "delivered",
    paymentMode: "upi",
    total: 399,
    itemCount: 2,
    hub: "Kondapur",
    placedAt: "2026-07-16T04:55:00.000Z",
    slaDueAt: "2026-07-16T05:05:00.000Z",
  },
  {
    id: "ord_10237",
    reference: "MZ-10237",
    customerName: "Meera Nair",
    customerId: "usr_005",
    status: "cancelled",
    paymentMode: "upi",
    total: 1049,
    itemCount: 1,
    hub: "Gachibowli",
    placedAt: "2026-07-16T04:40:00.000Z",
    slaDueAt: "2026-07-16T04:50:00.000Z",
  },
  {
    id: "ord_10236",
    reference: "MZ-10236",
    customerName: "Divya Rao",
    customerId: "usr_006",
    status: "delivered",
    paymentMode: "wallet",
    total: 878,
    itemCount: 4,
    hub: "Kondapur",
    placedAt: "2026-07-16T04:12:00.000Z",
    slaDueAt: "2026-07-16T04:22:00.000Z",
  },
  {
    id: "ord_10235",
    reference: "MZ-10235",
    customerName: "Ritu Verma",
    customerId: "usr_007",
    status: "delivered",
    paymentMode: "cod",
    total: 1599,
    itemCount: 2,
    hub: "Jubilee Hills",
    placedAt: "2026-07-16T03:50:00.000Z",
    slaDueAt: "2026-07-16T04:00:00.000Z",
  },
];

export function findOrder(id: string): AdminOrder | undefined {
  return orders.find((order) => order.id === id);
}

/**
 * True when an in-flight order has passed its promised time. Delivered and
 * cancelled orders are terminal and never count as breaching.
 */
export function isSlaBreached(order: AdminOrder, now = new Date()): boolean {
  if (order.status === "delivered" || order.status === "cancelled") {
    return false;
  }
  return new Date(order.slaDueAt).getTime() < now.getTime();
}
