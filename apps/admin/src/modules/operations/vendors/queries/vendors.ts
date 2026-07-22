import { queryOptions } from "@tanstack/react-query";
import { queryKeys } from "@/core/api/query-keys";
import { listVendors } from "../api/vendors-api";

/** Full, unpaginated vendor list for pickers (e.g. the product form). */
export const vendorsQueryOptions = queryOptions({
  queryKey: [...queryKeys.vendors.lists(), "picker"] as const,
  queryFn: () => listVendors({ page: 1, limit: 200 }),
  staleTime: 60_000,
  select: (result) => result.data,
});
