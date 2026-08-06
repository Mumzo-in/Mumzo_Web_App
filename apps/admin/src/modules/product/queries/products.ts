import { queryOptions } from "@tanstack/react-query";
import { queryKeys } from "@/core/api/query-keys";
import { getProduct } from "../api/products-api";

export const productQueryOptions = (id: string) =>
  queryOptions({
    queryKey: queryKeys.products.detail(id),
    queryFn: () => getProduct(id),
    staleTime: 30_000,
  });
