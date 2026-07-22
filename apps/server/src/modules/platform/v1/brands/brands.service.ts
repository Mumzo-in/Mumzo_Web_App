import { notFound } from "@/core/errors";
import * as brandsRepo from "@/modules/admin/v1/brands/brands.repo";

/**
 * Public reads reuse the admin repo's data access (`brands.repo.ts`, already
 * joins `productCount`) rather than duplicating queries. The only
 * public-specific rules: filter to `isActive` brands, and drop the internal
 * `id` — shoppers address brands by their real DB `slug`, never the id.
 */

function toPublicShape(brand: {
  name: string;
  slug: string;
  logoUrl: string | null;
  productCount: number;
}) {
  return {
    slug: brand.slug,
    name: brand.name,
    logoUrl: brand.logoUrl,
    productCount: brand.productCount,
  };
}

export async function listPublicBrands() {
  const rows = await brandsRepo.findAll();
  return rows
    .filter((row) => row.isActive)
    .map(toPublicShape)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function getPublicBrand(slug: string) {
  const brand = await brandsRepo.findBySlug(slug);
  if (!brand) {
    throw notFound("Brand");
  }

  // `findBySlug` only returns `id` — reuse `findById` for the full row so we
  // can check `isActive` and expose `logoUrl`/`productCount` publicly.
  const full = await brandsRepo.findById(brand.id);
  if (!full?.isActive) {
    throw notFound("Brand");
  }

  const productCount = await brandsRepo.productCount(full.id);
  return toPublicShape({ ...full, productCount });
}
