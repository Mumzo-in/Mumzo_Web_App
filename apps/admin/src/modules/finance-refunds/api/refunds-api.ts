import { apiRequest } from "@/core/api/client";

export type AdminRefundRow = {
  id: string;
  orderId: string;
  customerName: string;
  amount: number;
  reason: string;
  status: string;
  createdAt: string;
};

export function listRefunds(filters: {
  status?: string;
}): Promise<AdminRefundRow[]> {
  return apiRequest<AdminRefundRow[]>("/refunds", {
    query: { status: filters.status },
  });
}
