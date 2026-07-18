import type { Product } from "@mumzo/catalog-model";
import type { Paginated } from "@/core/api/client";
import { mockDelay, mockDetail, mockList } from "@/core/api/mock";
import type { ListParams } from "@/core/api/query-keys";
import { findProduct, products } from "../data/product-data";

/**
 * Products API — api-plan §15b.
 *
 * Currently resolves against seed data. When the endpoints land, each function
 * body swaps to `apiList`/`apiRequest` and nothing else in the module changes:
 *
 *   listProducts  → apiList<Product>("/products", params)
 *   getProduct    → apiRequest<Product>(`/products/${id}`)
 *   updateProduct → apiRequest(`/products/${id}`, { method: "PATCH", body })
 */

export function listProducts(params: ListParams): Promise<Paginated<Product>> {
  return mockList({
    rows: products,
    params,
    searchFields: ["name", "sku", "brand"],
    filter: (row) => {
      if (params.status && row.status !== params.status) {
        return false;
      }
      if (params.categorySlug && row.categorySlug !== params.categorySlug) {
        return false;
      }
      return true;
    },
  });
}

export function getProduct(id: string): Promise<Product> {
  return mockDetail(findProduct(id));
}

/**
 * Everything the form owns. Excludes the fields it doesn't:
 * `stock`/`rating` are derived or edited elsewhere, `id`/`updatedAt` are
 * server-owned. `costPrice`/`weight` are nullable.
 */
export type ProductInput = Omit<
  Product,
  "id" | "stock" | "rating" | "updatedAt"
>;

/** Total stock rolls up from variants when the product is sized. */
function rollUpStock(sizes: Product["sizes"], fallback: number): number {
  return sizes.length > 0
    ? sizes.reduce((sum, size) => sum + size.stock, 0)
    : fallback;
}

/**
 * Creates a product. Swaps to
 * `apiRequest<Product>("/products", { method: "POST", body: input })`.
 */
export async function createProduct(input: ProductInput): Promise<Product> {
  await mockDelay();
  const product: Product = {
    ...input,
    id: `prd_${Date.now().toString(36)}`,
    stock: rollUpStock(input.sizes, 0),
    rating: 0,
    updatedAt: new Date().toISOString(),
  };
  products.unshift(product);
  return product;
}

/**
 * Updates a product. Swaps to
 * `apiRequest<Product>(`/products/${id}`, { method: "PATCH", body: input })`.
 */
export async function updateProduct(
  id: string,
  input: ProductInput,
): Promise<Product> {
  await mockDelay();
  const index = products.findIndex((product) => product.id === id);
  if (index === -1) {
    const { ApiError } = await import("@/core/api/client");
    throw new ApiError("NOT_FOUND", "That product doesn't exist.", 404);
  }
  const existing = products[index];
  const updated: Product = {
    ...existing,
    ...input,
    // Stock is owned by the stock endpoint; a size edit still re-rolls it up.
    stock: rollUpStock(input.sizes, existing.stock),
    updatedAt: new Date().toISOString(),
  };
  products[index] = updated;
  return updated;
}
