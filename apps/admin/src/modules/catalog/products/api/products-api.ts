import type { Product } from "@mumzo/schema";
import { apiList, apiRequest, type Paginated } from "@/core/api/client";
import type { ListParams } from "@/core/api/query-keys";

/** Products API — real endpoints under `/api/v1/admin/products`. */

export function listProducts(params: ListParams): Promise<Paginated<Product>> {
  return apiList<Product>("/products", params);
}

export function getProduct(id: string): Promise<Product> {
  return apiRequest<Product>(`/products/${id}`);
}

/**
 * Everything the form owns. Excludes `id`/`stock`/`rating`/`updatedAt`:
 * `stock` rolls up server-side from `sizes`, `rating` is derived from
 * reviews, `id`/`updatedAt` are server-owned. `brandId`/`vendorId` replace
 * the display `brand`/`vendor` names the read shape carries — the form picks
 * an id, the server resolves it to the name on the way back out.
 */
export type ProductInput = Omit<
  Product,
  "id" | "brand" | "vendor" | "stock" | "rating" | "updatedAt"
> & { brandId: string; vendorId: string | null };

export function createProduct(input: ProductInput): Promise<Product> {
  return apiRequest<{ id: string }>("/products", {
    method: "POST",
    body: input,
  }).then(({ id }) => getProduct(id));
}

export function updateProduct(
  id: string,
  input: ProductInput,
): Promise<Product> {
  return apiRequest<{ ok: true }>(`/products/${id}`, {
    method: "PUT",
    body: input,
  }).then(() => getProduct(id));
}
