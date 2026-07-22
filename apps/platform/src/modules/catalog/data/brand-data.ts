import { type Product, products } from "@/core/data";

/**
 * The real `Brand` directory now lives behind the live API — see
 * `../api/brands-api.ts` / `../queries/brands.ts` (`PublicBrand`,
 * `brandsQueryOptions`). What's left here is `brandSlug()`, still needed as
 * a name→slug fallback: the mock `Product` list (`@/core/data`) only carries
 * a free-text `brand` name, not a real `brandId` join, so matching a product
 * to a brand slug still goes through this derived helper until a follow-up
 * Products pass relinks `Product.brandId` to the real `brand` table.
 */
export const brandSlug = (name: string): string =>
  name
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

/**
 * Shortcut: filters the still-mock product list by name-derived slug rather
 * than a real `brandId` join. Approximate until product-brand relinking
 * lands; matches the live brand directory closely enough for this pass.
 */
export const productsByBrand = (slug: string): Product[] =>
  products.filter((p) => brandSlug(p.brand) === slug);
