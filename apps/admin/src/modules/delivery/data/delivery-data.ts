/**
 * Rider-facing delivery run — the payload behind a shareable delivery link.
 *
 * A link is minted when ops moves an order to `out_for_delivery`; the token in
 * the URL is the only credential, so this view is deliberately public and
 * carries just what a rider needs on a phone: who, where, how much to collect,
 * and the three outcomes they can report back.
 */

export type DeliveryOutcome = "delivered" | "cancelled" | "returned";

export type DeliveryRunStatus = "out_for_delivery" | DeliveryOutcome;

export type DeliveryRunItem = {
  id: string;
  name: string;
  variantLabel: string | null;
  qty: number;
};

export type DeliveryRun = {
  token: string;
  orderId: string;
  status: DeliveryRunStatus;
  riderId: string;
  /** Who unlocked this link — the rider the access code identified. */
  riderName: string | null;
  customerName: string;
  customerPhone: string;
  addressLabel: string;
  addressLine1: string;
  addressLine2: string;
  addressLandmark: string | null;
  addressCity: string;
  addressPincode: string;
  /** Null until hub geocoding lands — the map button hides when absent. */
  latitude: number | null;
  longitude: number | null;
  hubName: string;
  itemCount: number;
  items: DeliveryRunItem[];
  total: number;
  paymentMethod: string;
  /** True for COD — the rider must collect `total` at the door. */
  collectCash: boolean;
  dispatchedAt: string;
  /** Set once the rider reports an outcome; the form locks afterwards. */
  completedAt: string | null;
  completionReason: string | null;
};

export const DELIVERY_OUTCOME_META: Record<
  DeliveryOutcome,
  { label: string; verb: string; tint: string }
> = {
  delivered: {
    label: "Delivered",
    verb: "Mark delivered",
    tint: "bg-sage text-ink",
  },
  cancelled: {
    label: "Cancelled",
    verb: "Cancel order",
    tint: "bg-destructive/10 text-destructive",
  },
  returned: {
    label: "Returned",
    verb: "Mark returned",
    tint: "bg-destructive/10 text-destructive",
  },
};

/** Reasons a rider picks from, per outcome. "Delivered" needs none — the
 * happy path is reasonless — but the other two must be attributable. */
export const DELIVERY_REASONS: Record<DeliveryOutcome, readonly string[]> = {
  delivered: [],
  cancelled: [
    "Customer refused the order",
    "Customer not reachable",
    "Address not found",
    "Payment declined at the door",
    "Other",
  ],
  returned: [
    "Damaged in transit",
    "Wrong item delivered",
    "Customer returned at the door",
    "Item expired or spoiled",
    "Other",
  ],
} as const;
