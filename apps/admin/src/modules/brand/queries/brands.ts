import { queryOptions } from "@tanstack/react-query";
import { queryKeys } from "@/core/api/query-keys";
import {
  getBrand,
  listAllBrands,
  listBrandProducts,
  listBrandVendors,
} from "../api/brands-api";

/** Full directory, unpaginated — for pickers (coupon scoping), not the table. */
export const brandsAllQueryOptions = queryOptions({
  queryKey: queryKeys.brands.lists(),
  queryFn: listAllBrands,
  staleTime: 60_000,
});

export const brandQueryOptions = (id: string) =>
  queryOptions({
    queryKey: queryKeys.brands.detail(id),
    queryFn: () => getBrand(id),
    staleTime: 30_000,
  });

export const brandProductsQueryOptions = (id: string) =>
  queryOptions({
    queryKey: queryKeys.brands.products(id),
    queryFn: () => listBrandProducts(id),
    staleTime: 30_000,
  });

export const brandVendorsQueryOptions = (id: string) =>
  queryOptions({
    queryKey: queryKeys.brands.vendors(id),
    queryFn: () => listBrandVendors(id),
    staleTime: 30_000,
  });
