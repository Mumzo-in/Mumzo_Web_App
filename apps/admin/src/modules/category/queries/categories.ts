import { queryOptions } from "@tanstack/react-query";
import { queryKeys } from "@/core/api/query-keys";
import { listCategories } from "../api/categories-api";

export const categoriesQueryOptions = queryOptions({
  queryKey: queryKeys.categories.lists(),
  queryFn: listCategories,
  staleTime: 60_000,
});
