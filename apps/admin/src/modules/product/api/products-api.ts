import type { Product } from "@mumzo/schema";
import type { Paginated } from "@/core/api/client";
import {
  mockCreate,
  mockDelete,
  mockDetail,
  mockId,
  mockList,
} from "@/core/api/mock";
import type { ListParams } from "@/core/api/query-keys";
import { brands } from "../../brand/data/brand-data";
import { vendors } from "../../vendor/data/vendor-data";
import { products } from "../data/product-data";

/** Products API — real endpoints under `/api/v1/admin/products`. */

export function listProducts(params: ListParams): Promise<Paginated<Product>> {
  return mockList({
    rows: products,
    params,
    searchFields: ["name", "sku", "slug"],
  });
}

export function getProduct(id: string): Promise<Product> {
  return mockDetail(products.find((product) => product.id === id));
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

/** Resolves the display names the server would fill in from foreign keys. */
function resolveVendor(
  vendor: ProductInput["vendor"],
): Product["vendor"] | null {
  if (!vendor) {
    return null;
  }
  const vendorName =
    vendors.find((row) => row.id === vendor.vendorId)?.name ?? "";
  return { ...vendor, vendorName };
}

function resolveBrandName(brandId: string): string {
  return brands.find((row) => row.id === brandId)?.name ?? "";
}

export async function createProduct(input: ProductInput): Promise<Product> {
  const id = mockId("prd");
  const { brandId, vendor, uploadSessionId: _uploadSessionId, ...rest } = input;
  await mockCreate(products, {
    ...rest,
    id,
    brandId,
    brand: resolveBrandName(brandId),
    vendor: resolveVendor(vendor),
    stock:
      rest.sizes.length > 0
        ? rest.sizes.reduce((sum, size) => sum + size.stock, 0)
        : rest.colors.length > 0
          ? rest.colors.reduce((sum, color) => sum + color.stock, 0)
          : 0,
    rating: 0,
    updatedAt: new Date().toISOString(),
  });
  return getProduct(id);
}

export async function updateProduct(
  id: string,
  input: ProductInput,
): Promise<Product> {
  const { uploadSessionId: _uploadSessionId, vendor, brandId, ...rest } = input;
  const current = products.find((product) => product.id === id);
  await mockDetail(current);
  const patch: Partial<Product> = {
    ...rest,
    brandId,
    brand: resolveBrandName(brandId),
    vendor: resolveVendor(vendor),
    updatedAt: new Date().toISOString(),
  };
  const index = products.findIndex((product) => product.id === id);
  products[index] = { ...products[index], ...patch };
  return getProduct(id);
}

export function deleteProduct(id: string): Promise<{ ok: true }> {
  return mockDelete(products, id);
}
