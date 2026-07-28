import { type Product, resolveCategorySlug } from "@mumzo/schema";
import type { PublicProduct } from "../api/products-api";

/**
 * Adapts the live public product (`GET /api/v1/products`, no `vendor`/
 * `costPrice`/`status` — those are admin-only) into `@mumzo/schema`'s
 * `Product` — the shape `ProductCard`, cart, and wishlist already render
 * against. Keeps the catalog-browsing swap to live data from rippling
 * through every consumer: only the query boundary needs to change.
 *
 * `categorySlug` is validated against the closed `CategorySlug` union (the
 * live API returns a plain string) — falls back to the raw value cast as
 * `never` only if genuinely unresolvable, which should not happen since the
 * seeded categories are a subset of `CATEGORY_SLUGS`.
 */
export function toProduct(p: PublicProduct): Product {
  const categorySlug =
    resolveCategorySlug(p.categorySlug) ?? (p.categorySlug as never);

  return {
    id: p.id,
    slug: p.slug,
    sku: p.sku,
    name: p.name,
    brand: p.brand,
    brandId: p.brandSlug,
    vendor: null,
    categorySlug,
    price: p.price,
    mrp: p.mrp,
    qty: p.qty,
    weight: p.weight,
    description: p.description,
    about: p.about,
    highlights: p.highlights,
    countryOfOrigin: p.countryOfOrigin,
    images: p.images,
    sizes: p.sizes,
    colors: p.colors,
    ages: p.ages as Product["ages"],
    type: p.type,
    tags: p.tags,
    stock: p.stock,
    rating: p.rating,
    isBestseller: p.isBestseller,
    status: "active",
    updatedAt: p.updatedAt,
  };
}
