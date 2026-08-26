import { apiList, apiRequest, type Paginated } from "@/core/api/client";
import type { ListParams } from "@/core/api/query-keys";
import type {
  AdminOrderDetail,
  AdminOrderSummary,
  OrderStatus,
} from "../data/order-data";

/** Orders API — api-plan §15d, backed by apps/server/.../admin/v1/orders. */
export function listOrders(
  params: ListParams,
): Promise<Paginated<AdminOrderSummary>> {
  return apiList<AdminOrderSummary>("/orders", params);
}

export function getOrder(id: string): Promise<AdminOrderDetail> {
  return apiRequest<AdminOrderDetail>(`/orders/${id}`);
}

export function updateOrderStatus(
  id: string,
  status: OrderStatus,
  note?: string,
  /** Required when dispatching — who is taking the order out. */
  riderId?: string,
): Promise<AdminOrderDetail> {
  return apiRequest<AdminOrderDetail>(`/orders/${id}/status`, {
    method: "PATCH",
    body: { status, note, riderId },
  });
}

export type CreateOrderLineInput = {
  productId: string;
  productSizeId?: string | null;
  productColorId?: string | null;
  qty: number;
};

export type CreateOrderInput = {
  hubId: string;
  customerId?: string;
  customerName: string;
  customerPhone: string;
  addressLine1: string;
  addressLine2?: string;
  addressLandmark?: string;
  addressPincode: string;
  addressCity: string;
  addressLabel?: string;
  items: CreateOrderLineInput[];
  note?: string;
};

export function createOrder(
  input: CreateOrderInput,
): Promise<AdminOrderDetail> {
  return apiRequest<AdminOrderDetail>("/orders", {
    method: "POST",
    body: input,
  });
}

export type OrderDeliveryLink = {
  token: string | null;
  outcome: string | null;
  riderName: string | null;
  riderPhone: string | null;
  /** The assigned rider's code — what ops reads out to them. */
  accessCode: string | null;
};

/** The rider link minted when the order was dispatched. */
export function getOrderDeliveryLink(id: string): Promise<OrderDeliveryLink> {
  return apiRequest<OrderDeliveryLink>(`/orders/${id}/delivery-link`);
}

/** Assign or reassign the rider on a dispatched order — also mints the link
 * if the order predates the rider requirement. */
export function assignOrderRider(
  id: string,
  riderId: string,
): Promise<OrderDeliveryLink> {
  return apiRequest<OrderDeliveryLink>(`/orders/${id}/assign-rider`, {
    method: "POST",
    body: { riderId },
  });
}
