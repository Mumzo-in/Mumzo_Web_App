import type { AgeGroup, ProductStatus, ProductVendor } from "@mumzo/schema";
import { apiList, apiRequest, type Paginated } from "@/core/api/client";
import type { ListParams } from "@/core/api/query-keys";

export type ProductVariant = {
  id?: string;
  label: string;
  price: number;
  stock: number;
};

export type Product = {
  id: string;
  slug: string;
  sku: string;
  name: string;
  brand: string;
  brandId: string;
  vendor: ProductVendor | null;
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
  sizes: ProductVariant[];
  colors: ProductVariant[];
  ages: AgeGroup[];
  type: string;
  tags: string[];
  stock: number;
  rating: number;
  isBestseller: boolean;
  status: ProductStatus;
  updatedAt: string;
};

export function listProducts(params: ListParams): Promise<Paginated<Product>> {
  return apiList<Product>("/products", params);
}

export function getProduct(id: string): Promise<Product> {
  return apiRequest<Product>(`/products/${encodeURIComponent(id)}`);
}

export type ProductVendorInput = {
  vendorId: string;
  relationship: "own" | "retainer" | "distributor";
  costPrice: number | null;
  leadTimeDays: number | null;
  notes: string | null;
} | null;

export type ProductInput = {
  name: string;
  slug: string;
  sku: string;
  brandId: string;
  vendor: ProductVendorInput;
  categorySlug: string;
  status: ProductStatus;
  price: number;
  mrp: number;
  qty: string;
  weight: string | null;
  description: string;
  about: string;
  highlights: string[];
  countryOfOrigin: string;
  images: string[];
  /** Draft upload session carrying new gallery images, if any were uploaded. */
  uploadSessionId?: string | null;
  sizes: ProductVariant[];
  colors: ProductVariant[];
  ages: string[];
  type: string;
  tags: string[];
  isBestseller: boolean;
};

export function createProduct(input: ProductInput): Promise<{ id: string }> {
  return apiRequest<{ id: string }>("/products", {
    method: "POST",
    body: input,
  });
}

export function updateProduct(
  id: string,
  input: ProductInput,
): Promise<{ ok: true }> {
  return apiRequest<{ ok: true }>(`/products/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: input,
  });
}

export function deleteProduct(id: string): Promise<{ ok: true }> {
  return apiRequest<{ ok: true }>(`/products/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}
