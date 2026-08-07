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
): Promise<AdminOrderDetail> {
  return apiRequest<AdminOrderDetail>(`/orders/${id}/status`, {
    method: "PATCH",
    body: { status },
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
