import type { OrderStatus } from "@/modules/orders";

/** Kanban columns — a subset/ordering of `OrderStatus`. Return states
 * (return_requested, returned) are deliberately excluded: they're shown as
 * a count badge, not a column operators drag things into. `pending_payment`
 * collapses into the same column as `confirmed` — COD orders confirm
 * immediately, so the two are indistinguishable to ops. `cancelled` is its
 * own terminal column so ops can see cancelled orders in place on the board. */
export type BoardColumnStatus = Exclude<
  OrderStatus,
  "pending_payment" | "return_requested" | "returned"
>;

export const BOARD_COLUMNS: {
  status: BoardColumnStatus;
  label: string;
  /** Optional steps can be skipped by a forward drag. `shipped` is optional
   * because a 10-minute hub delivery goes straight from packed to a rider —
   * there is no separate shipping leg — while a longer-haul order still
   * passes through it. */
  optional?: boolean;
}[] = [
  { status: "confirmed", label: "Order placed" },
  { status: "packed", label: "Packed" },
  { status: "shipped", label: "Shipped", optional: true },
  { status: "out_for_delivery", label: "Out for delivery" },
  { status: "delivered", label: "Delivered" },
  { status: "cancelled", label: "Cancelled" },
];

/** Statuses a forward drag is allowed to jump over. */
export const OPTIONAL_COLUMN_STATUSES: BoardColumnStatus[] =
  BOARD_COLUMNS.filter((column) => column.optional).map(
    (column) => column.status,
  );
