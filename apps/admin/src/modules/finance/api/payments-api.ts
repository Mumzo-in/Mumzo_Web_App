import type { Paginated } from "@/core/api/client";
import { mockDetail, mockList } from "@/core/api/mock";
import type { ListParams } from "@/core/api/query-keys";
import { type AdminPayment, findPayment, payments } from "../data/payment-data";

/** Payments API — api-plan §15i. */
export function listPayments(
  params: ListParams,
): Promise<Paginated<AdminPayment>> {
  return mockList({
    rows: payments,
    params,
    searchFields: ["gatewayRef", "orderReference", "customerName"],
    filter: (row) => !params.status || row.status === params.status,
  });
}

export function getPayment(id: string): Promise<AdminPayment> {
  return mockDetail(findPayment(id));
}

/** `GET /admin/payments/failed` — its own endpoint in the plan. */
export function listFailedPayments(
  params: ListParams,
): Promise<Paginated<AdminPayment>> {
  return mockList({
    rows: payments,
    params,
    searchFields: ["gatewayRef", "orderReference", "customerName"],
    filter: (row) => row.status === "failed" || row.status === "pending",
  });
}
