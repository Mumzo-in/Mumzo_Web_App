import { queryOptions } from "@tanstack/react-query";
import {
  getProduct,
  type ListProductsFilters,
  listProducts,
  listProductsByCategory,
} from "../api/products-api";

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

export const productQueryOptions = (id: string) =>
  queryOptions({
    queryKey: ["products", "detail", id],
    queryFn: () => getProduct(id),
    staleTime: 60_000,
  });
