import type { Paginated } from "@/core/api/client";
import { mockDetail, mockList } from "@/core/api/mock";
import type { ListParams } from "@/core/api/query-keys";
import { type AdminProduct, findProduct, products } from "../data/product-data";

/**
 * Products API — api-plan §15b.
 *
 * Currently resolves against seed data. When the endpoints land, each function
 * body swaps to `apiList`/`apiRequest` and nothing else in the module changes:
 *
 *   listProducts  → apiList<AdminProduct>("/products", params)
 *   getProduct    → apiRequest<AdminProduct>(`/products/${id}`)
 *   updateProduct → apiRequest(`/products/${id}`, { method: "PATCH", body })
 */

export function listProducts(
  params: ListParams,
): Promise<Paginated<AdminProduct>> {
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

export function getProduct(id: string): Promise<AdminProduct> {
  return mockDetail(findProduct(id));
}
