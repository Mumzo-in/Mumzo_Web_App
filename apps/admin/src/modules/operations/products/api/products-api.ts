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
 * reviews, `id`/`updatedAt` are server-owned. `brandId` replaces the display
 * `brand` name the read shape carries — the form picks an id, the server
 * resolves it to the name on the way back out. `vendor` keeps its nested
 * sourcing shape (the form edits `vendorId`/`relationship`/etc directly;
 * `vendorName` isn't part of the input). `uploadSessionId` is write-only —
 * set when the Media tab uploaded new images this submit, so the server can
 * finalize that draft session's images to their final product-scoped keys.
 */
export type ProductInput = Omit<
  Product,
  "id" | "brand" | "vendor" | "stock" | "rating" | "updatedAt"
> & {
  brandId: string;
  vendor: Omit<NonNullable<Product["vendor"]>, "vendorName"> | null;
  uploadSessionId?: string | null;
};

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

export function deleteProduct(id: string): Promise<{ ok: true }> {
  return apiRequest<{ ok: true }>(`/products/${id}`, { method: "DELETE" });
}
