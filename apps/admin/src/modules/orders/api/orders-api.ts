import type { Paginated } from "@/core/api/client";
import { mockDetail, mockList } from "@/core/api/mock";
import type { ListParams } from "@/core/api/query-keys";
import { type AdminOrder, findOrder, orders } from "../data/order-data";

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
