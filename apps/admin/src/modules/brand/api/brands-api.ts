import { apiList, apiRequest, type Paginated } from "@/core/api/client";
import type { ListParams } from "@/core/api/query-keys";
import { products } from "../../product/data/product-data";

export type Brand = {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  isActive: boolean;
  categorySlugs: string[];
  productCount: number;
};

export function listBrands(params: ListParams): Promise<Paginated<Brand>> {
  return apiList<Brand>("/brands", params);
}

/** Full, unpaginated directory — for pickers (coupon scoping) that need every brand at once. */
export async function listAllBrands(): Promise<Brand[]> {
  const { data } = await apiList<Brand>("/brands", { limit: 100 });
  return data;
}

export function getBrand(id: string): Promise<Brand> {
  return apiRequest<Brand>(`/brands/${encodeURIComponent(id)}`);
}

export type BrandInput = {
  name: string;
  slug: string;
  logoUrl?: string | null;
  isActive: boolean;
  categorySlugs: string[];
  /** Draft upload session carrying a new logo, if one was uploaded. */
  uploadSessionId?: string;
};

export function createBrand(input: BrandInput): Promise<{ id: string }> {
  return apiRequest<{ id: string }>("/brands", {
    method: "POST",
    body: input,
  });
}

export function updateBrand(
  id: string,
  input: Partial<BrandInput>,
): Promise<{ ok: true }> {
  return apiRequest<{ ok: true }>(`/brands/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: input,
  });
}

export function deleteBrand(id: string): Promise<{ ok: true }> {
  return apiRequest<{ ok: true }>(`/brands/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

export type BrandProductRow = {
  id: string;
  name: string;
  slug: string;
  categorySlug: string;
  vendorName: string | null;
  price: number;
  stock: number;
  status: string;
};

/**
 * Products stocked under a brand — feeds the brand detail page's Products
 * tab. No `/admin/brands/:id/products` endpoint exists yet, so this still
 * reads local product fixtures; the UI marks it as needing a real backend.
 */
export async function listBrandProducts(
  brandId: string,
): Promise<BrandProductRow[]> {
  return products
    .filter((product) => product.brandId === brandId)
    .map((product) => ({
      id: product.id,
      name: product.name,
      slug: product.slug,
      categorySlug: product.categorySlug,
      vendorName: product.vendor?.vendorName ?? null,
      price: product.price,
      stock: product.stock,
      status: product.status,
    }));
}

export type BrandVendorRow = {
  vendorId: string;
  vendorName: string;
  productCount: number;
};

/**
 * Distinct vendors sourcing products for a brand — feeds the Vendors tab. No
 * `/admin/brands/:id/vendors` endpoint exists yet, so this still reads local
 * product fixtures; the UI marks it as needing a real backend.
 */
export async function listBrandVendors(
  brandId: string,
): Promise<BrandVendorRow[]> {
  const byVendor = new Map<string, BrandVendorRow>();
  for (const product of products) {
    if (product.brandId !== brandId || !product.vendor) {
      continue;
    }
    const existing = byVendor.get(product.vendor.vendorId);
    if (existing) {
      existing.productCount += 1;
    } else {
      byVendor.set(product.vendor.vendorId, {
        vendorId: product.vendor.vendorId,
        vendorName: product.vendor.vendorName,
        productCount: 1,
      });
    }
  }
  return [...byVendor.values()];
}
