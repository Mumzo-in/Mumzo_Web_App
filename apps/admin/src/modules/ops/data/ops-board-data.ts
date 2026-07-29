import type { OrderStatus } from "@/modules/orders";

/** Kanban columns — a subset/ordering of `OrderStatus`. `cancelled` is
 * deliberately excluded: it's an exception state shown as a count badge, not
 * a column operators drag things into. */
export type BoardColumnStatus = Exclude<OrderStatus, "cancelled">;

export const BOARD_COLUMNS: {
  status: BoardColumnStatus;
  label: string;
}[] = [
  { status: "placed", label: "Placed" },
  { status: "packed", label: "Packed" },
  { status: "out_for_delivery", label: "Out for delivery" },
  { status: "delivered", label: "Delivered" },
];

export type NewOrderLineItem = {
  productId: string;
  productName: string;
  variantLabel: string;
  qty: number;
  price: number;
};

/**
 * What the "New order" form collects. Richer than `AdminOrder` (line items,
 * address) — there's no `order` table yet, so on submit this gets summarized
 * down to an `AdminOrder` row (see `api/ops-api.ts` `createOrder`) rather
 * than widening `AdminOrder` itself for a mock-only form.
 */
export type NewOrderInput = {
  customerId: string | null;
  customerName: string;
  customerPhone: string;
  hub: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  pincode: string;
  items: NewOrderLineItem[];
  paymentMode: "cod" | "prepaid";
};

export function newOrderSubtotal(items: NewOrderLineItem[]): number {
  return items.reduce((sum, item) => sum + item.price * item.qty, 0);
}
