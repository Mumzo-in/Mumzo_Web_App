import { apiList, apiRequest, type Paginated } from "@/core/api/client";

/** Mirrors apps/server's order state machine
 * (docs/order-checkout-flow.md §5) — the full lifecycle, not just the
 * subset the old mock data used. */
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

export interface OrderItem {
  id: string;
  productId: string;
  name: string;
  variantLabel: string | null;
  price: number;
  qty: number;
}

export interface OrderStatusLogEntry {
  id: string;
  fromStatus: OrderStatus | null;
  toStatus: OrderStatus;
  actor: string;
  note: string | null;
  createdAt: string;
}

export interface OrderSummary {
  id: string;
  status: OrderStatus;
  itemCount: number;
  subtotal: number;
  total: number;
  placedAt: string;
}

export interface OrderDetail {
  id: string;
  status: OrderStatus;
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
  items: OrderItem[];
  statusLog: OrderStatusLogEntry[];
  placedAt: string;
}

export interface PlaceOrderInput {
  addressId: string;
  idempotencyKey: string;
}

export function placeOrder(input: PlaceOrderInput): Promise<OrderDetail> {
  return apiRequest<OrderDetail>("/orders", { method: "POST", body: input });
}

export interface OrderSavings {
  totalSaved: number;
  orderCount: number;
}

/** Lifetime total saved via coupons across every past (non-cancelled)
 * order — feeds the rewards hub's "how much you've saved" summary. */
export function fetchOrderSavings(): Promise<OrderSavings> {
  return apiRequest<OrderSavings>("/orders/savings");
}

export function fetchOrders(
  params: { page?: number; limit?: number } = {},
): Promise<Paginated<OrderSummary>> {
  return apiList<OrderSummary>("/orders", params);
}

export function fetchOrder(id: string): Promise<OrderDetail> {
  return apiRequest<OrderDetail>(`/orders/${id}`);
}

export function cancelOrder(id: string, reason?: string): Promise<OrderDetail> {
  return apiRequest<OrderDetail>(`/orders/${id}/cancel`, {
    method: "POST",
    body: { reason },
  });
}
