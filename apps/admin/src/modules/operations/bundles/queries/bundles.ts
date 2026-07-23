import { queryOptions } from "@tanstack/react-query";
import { queryKeys } from "@/core/api/query-keys";
import { listBundles } from "../api/bundles-api";

/** Bundles that include a given product — the product form's discovery tab. */
export function bundlesForProductQueryOptions(productId: string) {
  return queryOptions({
    queryKey: [...queryKeys.bundles.lists(), "byProduct", productId] as const,
    queryFn: () => listBundles({ productId, page: 1, limit: 50 }),
    enabled: Boolean(productId),
  });
}
