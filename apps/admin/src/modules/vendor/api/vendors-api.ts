import type { Paginated } from "@/core/api/client";
import { mockDelay, mockDetail, mockId, mockList } from "@/core/api/mock";
import type { ListParams } from "@/core/api/query-keys";
import { products } from "../../product/data/product-data";
import { vendors } from "../data/vendor-data";

export type Vendor = {
  id: string;
  name: string;
  slug: string;
  contactName: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  gstin: string | null;
  isActive: boolean;
  productCount: number;
};

/**
 * `productCount` is derived at read time from the product fixtures —
 * `vendor-data.ts` never stores it, so it can't drift out of sync. Importing
 * `product-data` here (instead of in `vendor-data.ts`) avoids a circular
 * dependency between the two data modules.
 */
function withProductCount(row: Omit<Vendor, "productCount">): Vendor {
  return {
    ...row,
    productCount: products.filter(
      (product) => product.vendor?.vendorId === row.id,
    ).length,
  };
}

export async function listVendors(
  params: ListParams,
): Promise<Paginated<Vendor>> {
  const result = await mockList({
    rows: vendors,
    params,
    searchFields: ["name", "slug", "email"],
  });
  return { ...result, data: result.data.map(withProductCount) };
}

export function getVendor(id: string): Promise<Vendor> {
  const found = vendors.find((vendor) => vendor.id === id);
  return mockDetail(found ? withProductCount(found) : undefined);
}

/** Everything the form owns. `id`/`productCount` are server-owned. */
export type VendorInput = {
  name: string;
  slug: string;
  contactName: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  gstin: string | null;
  isActive: boolean;
};

export async function createVendor(input: VendorInput): Promise<Vendor> {
  await mockDelay();
  const id = mockId("vendor");
  vendors.push({ id, ...input });
  return getVendor(id);
}

export async function updateVendor(
  id: string,
  input: Partial<VendorInput>,
): Promise<Vendor> {
  await mockDelay();
  const index = vendors.findIndex((vendor) => vendor.id === id);
  if (index === -1) {
    const { ApiError } = await import("@/core/api/client");
    throw new ApiError("NOT_FOUND", "That record doesn't exist.", 404);
  }
  vendors[index] = { ...vendors[index], ...input };
  return getVendor(id);
}

export async function deleteVendor(id: string): Promise<{ ok: true }> {
  await mockDelay();
  const index = vendors.findIndex((vendor) => vendor.id === id);
  if (index === -1) {
    const { ApiError } = await import("@/core/api/client");
    throw new ApiError("NOT_FOUND", "That record doesn't exist.", 404);
  }
  vendors.splice(index, 1);
  return { ok: true };
}
