import { queryOptions } from "@tanstack/react-query";
import { getBrand, listBrands } from "../api/brands-api";

/** All brands are fetched unpaginated — the directory page needs the full list. */
export const brandsQueryOptions = queryOptions({
  queryKey: ["brands", "list"],
  queryFn: listBrands,
  staleTime: 60_000,
});

export const brandQueryOptions = (slug: string) =>
  queryOptions({
    queryKey: ["brands", "detail", slug],
    queryFn: () => getBrand(slug),
    staleTime: 60_000,
  });
