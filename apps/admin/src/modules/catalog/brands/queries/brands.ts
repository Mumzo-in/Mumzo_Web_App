import { queryOptions } from "@tanstack/react-query";
import { queryKeys } from "@/core/api/query-keys";
import { listBrands } from "../api/brands-api";

/** All brands are fetched unpaginated — the picker and the directory both need the full list. */
export const brandsQueryOptions = queryOptions({
  queryKey: queryKeys.brands.lists(),
  queryFn: () => listBrands(),
  staleTime: 60_000,
});
