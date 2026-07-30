import { queryOptions } from "@tanstack/react-query";
import { fetchOrder, fetchOrders } from "../api/orders-api";

export const ordersQueryOptions = (
  params: { page?: number; limit?: number } = {},
) =>
  queryOptions({
    queryKey: ["orders", params],
    queryFn: () => fetchOrders(params),
  });

export const orderQueryOptions = (id: string) =>
  queryOptions({
    queryKey: ["orders", id],
    queryFn: () => fetchOrder(id),
  });
