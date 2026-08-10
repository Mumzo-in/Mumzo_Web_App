import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query";
import {
  getProduct,
  type ListProductsFilters,
  listProducts,
  listProductsByCategory,
} from "../api/products-api";

export const INFINITE_PAGE_SIZE = 20;

/** Serializable key so identical filter sets share a cache entry. */
function filtersKey(filters: ListProductsFilters) {
  return {
    page: filters.page ?? 1,
    limit: filters.limit ?? 20,
    search: filters.search ?? null,
    categorySlug: filters.categorySlug ?? null,
    sort: filters.sort ?? "relevance",
    brands: filters.brands ?? [],
    minPrice: filters.minPrice ?? null,
    maxPrice: filters.maxPrice ?? null,
    sizes: filters.sizes ?? [],
    inStock: filters.inStock ?? null,
    bestseller: filters.bestseller ?? null,
    topDeal: filters.topDeal ?? null,
  };
}

export const productsQueryOptions = (filters: ListProductsFilters = {}) =>
  queryOptions({
    queryKey: ["products", "list", filtersKey(filters)],
    queryFn: () => listProducts(filters),
    staleTime: 60_000,
  });

export const productsByCategoryQueryOptions = (
  categorySlug: string,
  filters: Omit<ListProductsFilters, "categorySlug"> = {},
) =>
  queryOptions({
    queryKey: [
      "products",
      "list-by-category",
      categorySlug,
      filtersKey(filters),
    ],
    queryFn: () => listProductsByCategory(categorySlug, filters),
    staleTime: 60_000,
  });

/**
 * Infinite-scroll variant of `productsQueryOptions` — first page loads
 * `INFINITE_PAGE_SIZE` (20) products; `fetchNextPage` pulls the next 20
 * instead of the page reloading everything up to that point. Excludes
 * `page`/`limit` from the filter set since those are driven by the infinite
 * query itself, not the caller.
 */
export const productsInfiniteQueryOptions = (
  filters: Omit<ListProductsFilters, "page" | "limit"> = {},
) =>
  infiniteQueryOptions({
    queryKey: ["products", "list-infinite", filtersKey(filters)],
    queryFn: ({ pageParam }) =>
      listProducts({ ...filters, page: pageParam, limit: INFINITE_PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.meta.hasNext ? lastPage.meta.page + 1 : undefined,
    staleTime: 60_000,
  });

export const productQueryOptions = (id: string) =>
  queryOptions({
    queryKey: ["products", "detail", id],
    queryFn: () => getProduct(id),
    staleTime: 60_000,
  });
