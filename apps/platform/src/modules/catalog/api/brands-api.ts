import { apiRequest } from "@/core/api/client";

/**
 * Public brand shape returned by `GET /api/v1/brands` — see
 * `apps/server/src/modules/platform/v1/brands/brands.schema.ts`. Slug is the
 * real DB column (unique, set by the admin brand form), not the storefront's
 * derived `brandSlug()` helper.
 */
export type PublicBrand = {
  slug: string;
  name: string;
  logoUrl: string | null;
  productCount: number;
};

/** Live brands API — real endpoint under `/api/v1/brands`, keyed by slug. */
export function listBrands(): Promise<PublicBrand[]> {
  return apiRequest<PublicBrand[]>("/brands");
}

export function getBrand(slug: string): Promise<PublicBrand> {
  return apiRequest<PublicBrand>(`/brands/${slug}`);
}
