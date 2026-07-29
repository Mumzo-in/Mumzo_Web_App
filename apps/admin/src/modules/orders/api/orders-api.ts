import type { Paginated } from "@/core/api/client";
import { mockDelay, mockDetail, mockList } from "@/core/api/mock";
import type { ListParams } from "@/core/api/query-keys";
import {
  type AdminOrder,
  findOrder,
  type OrderStatus,
  orders,
} from "../data/order-data";

/**
 * Orders API — api-plan §15d.
 * Swaps to `apiList("/orders", params)` / `apiRequest("/orders/" + id)`.
 */
export function listOrders(params: ListParams): Promise<Paginated<AdminOrder>> {
  return mockList({
    rows: orders,
    params,
    searchFields: ["reference", "customerName", "hub"],
    filter: (row) => !params.status || row.status === params.status,
  });
}

export function getOrder(id: string): Promise<AdminOrder> {
  return mockDetail(findOrder(id));
}

/**
 * Mutates the mock `orders` array in place — swaps to
 * `apiRequest("/orders/" + id + "/status", { method: "PATCH", body: { status } })`
 * once a real endpoint exists. Any-direction transition is allowed here
 * deliberately (ops needs to correct mis-drags); `ORDER_FLOW` is display
 * ordering, not an enforced state machine.
 */
export async function updateOrderStatus(
  id: string,
  status: OrderStatus,
): Promise<AdminOrder> {
  await mockDelay();
  const order = findOrder(id);
  if (!order) {
    throw new Error("Order not found.");
  }
  order.status = status;
  return order;
}
