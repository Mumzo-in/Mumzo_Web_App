import {
  mockCreate,
  mockDelay,
  mockDelete,
  mockId,
  mockUpdate,
} from "@/core/api/mock";
import { products } from "../../product/data/product-data";
import { brands } from "../data/brand-data";

export type Brand = {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  isActive: boolean;
  productCount: number;
};

/**
 * `productCount` is derived at read time from the product fixtures — brand
 * fixtures never store it, so the two can't drift apart. Importing
 * `product-data` here (rather than in `brand-data.ts`) avoids a circular
 * dependency between the two data modules.
 */
function withProductCount(row: Omit<Brand, "productCount">): Brand {
  return {
    ...row,
    productCount: products.filter((product) => product.brandId === row.id)
      .length,
  };
}

export async function listBrands(search?: string): Promise<Brand[]> {
  await mockDelay();
  const needle = search?.trim().toLowerCase();
  const rows = needle
    ? brands.filter((row) => row.name.toLowerCase().includes(needle))
    : brands;
  return rows.map(withProductCount);
}

export type BrandInput = {
  name: string;
  slug: string;
  logoUrl?: string | null;
  isActive: boolean;
  /** Draft upload session carrying a new logo, if one was uploaded. */
  uploadSessionId?: string;
};

export function createBrand(input: BrandInput): Promise<{ id: string }> {
  const id = mockId("brand");
  return mockCreate(brands, {
    id,
    name: input.name,
    slug: input.slug,
    logoUrl: input.logoUrl ?? null,
    isActive: input.isActive,
  }).then(() => ({ id }));
}

export async function updateBrand(
  id: string,
  input: Partial<BrandInput>,
): Promise<{ ok: true }> {
  const { uploadSessionId: _uploadSessionId, ...patch } = input;
  await mockUpdate<Omit<Brand, "productCount">>(brands, id, patch);
  return { ok: true };
}

export function deleteBrand(id: string): Promise<{ ok: true }> {
  return mockDelete(brands, id);
}
