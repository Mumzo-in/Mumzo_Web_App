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
    name: p.name,
    brand: p.brand,
    brandId: p.brandSlug,
    vendor: null,
    categorySlug,
    price: p.price,
    mrp: p.mrp,
    unitType: null,
    qty: p.qty,
    description: p.description,
    about: p.about,
    highlights: p.highlights,
    countryOfOrigin: p.countryOfOrigin,
    images: p.images,
    sizes: p.sizes.map((s) => ({
      id: s.id,
      label: s.label,
      price: s.price,
      stock: s.stock,
      // Public API never exposes a real SKU/MRP/cost/qty per variant — the
      // variant's own id is the only stable identifier available here.
      sku: s.id,
      mrp: p.mrp,
      costPrice: null,
      qty: p.qty,
    })),
    colors: p.colors.map((c) => ({
      id: c.id,
      label: c.label,
      price: c.price,
      stock: c.stock,
      sku: c.id,
      mrp: p.mrp,
      costPrice: null,
      qty: p.qty,
    })),
    ages: p.ages as Product["ages"],
    type: p.type,
    tags: p.tags,
    stock: p.stock,
    rating: p.rating,
    isBestseller: p.isBestseller,
    isTopDeal: p.isTopDeal,
    status: "active",
    updatedAt: p.updatedAt,
  };
}
