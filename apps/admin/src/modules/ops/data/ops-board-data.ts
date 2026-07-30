import type { OrderStatus } from "@/modules/orders";

/** Kanban columns — a subset/ordering of `OrderStatus`. Exception/terminal
 * states (cancelled, return_requested, returned) are deliberately excluded:
 * they're shown as a count badge, not a column operators drag things into.
 * `pending_payment` collapses into the same column as `confirmed` — COD
 * orders confirm immediately, so the two are indistinguishable to ops. */
export type BoardColumnStatus = Exclude<
  OrderStatus,
  "pending_payment" | "cancelled" | "return_requested" | "returned"
>;

export const BOARD_COLUMNS: {
  status: BoardColumnStatus;
  label: string;
}[] = [
  { status: "confirmed", label: "Order placed" },
  { status: "packed", label: "Packed" },
  { status: "shipped", label: "Shipped" },
  { status: "out_for_delivery", label: "Out for delivery" },
  { status: "delivered", label: "Delivered" },
];
