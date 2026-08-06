import { queryOptions } from "@tanstack/react-query";
import { queryKeys } from "@/core/api/query-keys";
import {
  getVendor,
  getVendorSaleSummary,
  listAllVendors,
  listVendorInvoices,
  listVendorProducts,
} from "../api/vendors-api";

/** Full directory, unpaginated — for pickers (PO/transfer forms later). */
export const vendorsAllQueryOptions = queryOptions({
  queryKey: queryKeys.vendors.lists(),
  queryFn: listAllVendors,
  staleTime: 60_000,
});

export const vendorQueryOptions = (id: string) =>
  queryOptions({
    queryKey: queryKeys.vendors.detail(id),
    queryFn: () => getVendor(id),
    staleTime: 30_000,
  });

export const vendorProductsQueryOptions = (id: string) =>
  queryOptions({
    queryKey: queryKeys.vendors.products(id),
    queryFn: () => listVendorProducts(id),
    staleTime: 30_000,
  });

export const vendorInvoicesQueryOptions = (id: string) =>
  queryOptions({
    queryKey: queryKeys.vendors.invoices(id),
    queryFn: () => listVendorInvoices(id),
    staleTime: 30_000,
  });

export const vendorSaleSummaryQueryOptions = (id: string) =>
  queryOptions({
    queryKey: queryKeys.vendors.saleSummary(id),
    queryFn: () => getVendorSaleSummary(id),
    staleTime: 30_000,
  });
