import { queryOptions } from "@tanstack/react-query";
import { listCategories } from "../api/categories-api";

/** All categories are fetched unpaginated — the home shelf and category nav both need the full list. */
export const categoriesQueryOptions = queryOptions({
  queryKey: ["categories", "list"],
  queryFn: listCategories,
  staleTime: 60_000,
});
