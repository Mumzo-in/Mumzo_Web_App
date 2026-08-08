import type {
  AgeGroup,
  ProductStatus,
  ProductVendor,
  UnitType,
} from "@mumzo/schema";
import { apiList, apiRequest, type Paginated } from "@/core/api/client";
import type { ListParams } from "@/core/api/query-keys";

export type ProductVariant = {
  id?: string;
  label: string;
  sku: string;
  price: number;
  mrp: number;
  costPrice: number | null;
  stock: number;
  weightGrams?: number;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  brand: string;
  brandId: string;
  vendor: ProductVendor | null;
  categorySlug: string;
  /** Rolled up from the primary (first) variant server-side. */
  price: number;
  mrp: number;
  unitType: UnitType | null;
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

/** `costPrice` is ignored on write — the server derives it from the primary
 * variant's `costPrice` (`sizes[0]`) so there's one source of truth. */
export type ProductVendorInput = {
  vendorId: string;
  relationship: "own" | "retainer" | "distributor";
  costPrice: number | null;
  leadTimeDays: number | null;
  notes: string | null;
} | null;

/** `sku`/`price`/`mrp` aren't here — they're per-variant now (`sizes[]`); the
 * product row's own `sku`/`price`/`mrp` are derived server-side from the
 * primary (first) variant. */
export type ProductInput = {
  name: string;
  slug: string;
  brandId: string;
  vendor: ProductVendorInput;
  categorySlug: string;
  status: ProductStatus;
  unitType: UnitType | null;
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
