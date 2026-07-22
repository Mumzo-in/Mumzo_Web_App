import { apiList, apiRequest, type Paginated } from "@/core/api/client";

/**
 * Public product size/variant shape returned by `GET /api/v1/products` —
 * see `apps/server/src/modules/platform/v1/products/products.schema.ts`.
 */
export type PublicProductSize = {
  label: string;
  price: number;
  stock: number;
};

/**
 * Public product shape. Slug/brandSlug/categorySlug are plain strings here
 * (not `@mumzo/schema`'s closed unions) since they come live from the
 * database. No `costPrice` — the public API never exposes margin.
 */
export type PublicProduct = {
  id: string;
  slug: string;
  sku: string;
  name: string;
  brand: string;
  brandSlug: string;
  categorySlug: string;
  price: number;
  mrp: number;
  qty: string;
  weight: string | null;
  description: string;
  about: string;
  highlights: string[];
  countryOfOrigin: string;
  images: string[];
  sizes: PublicProductSize[];
  ages: string[];
  type: string;
  tags: string[];
  stock: number;
  rating: number;
  isBestseller: boolean;
  updatedAt: string;
};

export type ProductSort =
  | "relevance"
  | "price_asc"
  | "price_desc"
  | "discount"
  | "rating";

export type ListProductsFilters = {
  page?: number;
  limit?: number;
  search?: string;
  categorySlug?: string;
  sort?: ProductSort;
  brands?: string[];
  minPrice?: number;
  maxPrice?: number;
  sizes?: string[];
  inStock?: boolean;
};

/** Live products API — real endpoint under `/api/v1/products`. */
export function listProducts(
  filters: ListProductsFilters = {},
): Promise<Paginated<PublicProduct>> {
  return apiList<PublicProduct>("/products", {
    page: filters.page,
    limit: filters.limit,
    search: filters.search,
    categorySlug: filters.categorySlug,
    sort: filters.sort,
    brands: filters.brands?.join(","),
    minPrice: filters.minPrice,
    maxPrice: filters.maxPrice,
    sizes: filters.sizes?.join(","),
    inStock: filters.inStock,
  });
}

export function getProduct(id: string): Promise<PublicProduct> {
  return apiRequest<PublicProduct>(`/products/${id}`);
}

/** Products in a category — `GET /api/v1/categories/:slug/products`. */
export function listProductsByCategory(
  categorySlug: string,
  filters: Omit<ListProductsFilters, "categorySlug"> = {},
): Promise<Paginated<PublicProduct>> {
  return apiList<PublicProduct>(`/categories/${categorySlug}/products`, {
    page: filters.page,
    limit: filters.limit,
    search: filters.search,
    sort: filters.sort,
    brands: filters.brands?.join(","),
    minPrice: filters.minPrice,
    maxPrice: filters.maxPrice,
    sizes: filters.sizes?.join(","),
    inStock: filters.inStock,
  });
}
