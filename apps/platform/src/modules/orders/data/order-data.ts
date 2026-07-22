import { findProduct } from "@/core/data";

/**
 * Left on the mock catalog deliberately: every order below is itself
 * fabricated mock data (fixed order ids, addresses, item lists referencing
 * mock product ids like "wet-wipes-99"). Orders aren't backed by a real
 * cart/checkout yet, so there is no live order to resolve real product ids
 * from — swapping just this lookup to the live product API would require
 * rewriting the mock orders below to reference real seeded product ids too,
 * which is out of scope until orders themselves are real. Revisit once
 * checkout/orders are wired to the DB.
 */

export type OrderStatus =
  | "placed"
  | "packed"
  | "out_for_delivery"
  | "delivered"
  | "cancelled";

export interface OrderItem {
  id: string;
  name: string;
  brand: string;
  img: string;
  price: number;
  qty: number;
  size: string | null;
}

export interface OrderAddress {
  label: string;
  name: string;
  line: string;
  phone: string;
}

export interface Order {
  id: string;
  placedAt: string;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  delivery: number;
  gst: number;
  total: number;
  paymentLabel: string;
  slotLabel: string;
  address: OrderAddress;
  rider?: { name: string; phone: string; vehicle: string; etaMins: number };
}

export const STATUS_META: Record<OrderStatus, { label: string; tint: string }> =
  {
    placed: { label: "Order placed", tint: "bg-accent/50 text-ink" },
    packed: { label: "Packed", tint: "bg-accent/50 text-ink" },
    out_for_delivery: {
      label: "Out for delivery",
      tint: "bg-primary/10 text-primary",
    },
    delivered: { label: "Delivered", tint: "bg-sage/60 text-ink" },
    cancelled: {
      label: "Cancelled",
      tint: "bg-destructive/10 text-destructive",
    },
  };

export const ORDER_FLOW: OrderStatus[] = [
  "placed",
  "packed",
  "out_for_delivery",
  "delivered",
];

function oi(id: string, qty: number, size: string | null = null): OrderItem {
  const p = findProduct(id);
  return {
    id,
    name: p?.name ?? id,
    brand: p?.brand ?? "Mumzo",
    img: p?.images[0] ?? "",
    price: p?.price ?? 0,
    qty,
    size,
  };
}

function bill(items: OrderItem[], discount: number, delivery: number) {
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const gst = Math.round((subtotal - discount) * 0.05);
  return {
    subtotal,
    discount,
    delivery,
    gst,
    total: Math.max(0, subtotal - discount + delivery + gst),
  };
}

const banjara: OrderAddress = {
  label: "Home",
  name: "Ananya Reddy",
  line: "Flat 402, Lotus Residency, Banjara Hills, Hyderabad — 500034",
  phone: "98480 12345",
};

function makeOrder(
  o: Omit<Order, "subtotal" | "discount" | "delivery" | "gst" | "total"> & {
    discount?: number;
    delivery?: number;
  },
): Order {
  const { discount = 0, delivery = 0, ...rest } = o;
  return { ...rest, ...bill(rest.items, discount, delivery) };
}

export const orders: Order[] = [
  makeOrder({
    id: "MZ48210934",
    placedAt: "2026-07-15T09:12:00+05:30",
    status: "out_for_delivery",
    items: [oi("wet-wipes-99", 2), oi("cotton-balls", 1)],
    delivery: 0,
    discount: 40,
    paymentLabel: "UPI",
    slotLabel: "Express · 10–15 min",
    address: banjara,
    rider: {
      name: "Ravi Kumar",
      phone: "90000 11223",
      vehicle: "TS09 · Activa",
      etaMins: 8,
    },
  }),
  makeOrder({
    id: "MZ48119045",
    placedAt: "2026-07-12T18:40:00+05:30",
    status: "delivered",
    items: [oi("hand-sanitiser", 1), oi("wet-wipes-99", 1)],
    delivery: 25,
    paymentLabel: "Cash on delivery",
    slotLabel: "Today · 5 PM – 8 PM",
    address: banjara,
  }),
  makeOrder({
    id: "MZ47903318",
    placedAt: "2026-07-05T11:05:00+05:30",
    status: "cancelled",
    items: [oi("cotton-balls", 2)],
    delivery: 25,
    paymentLabel: "UPI",
    slotLabel: "Express · 10–15 min",
    address: banjara,
  }),
];

export const findOrder = (id: string): Order | undefined =>
  orders.find((o) => o.id === id);

export const formatOrderDate = (iso: string): string =>
  new Date(iso).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
