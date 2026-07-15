import { type Product, products } from "@/core/data";

export interface Brand {
  slug: string;
  name: string;
  productCount: number;
}

export const brandSlug = (name: string): string =>
  name
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

/** Brands are derived from the catalog so they never drift from the products. */
export const brands: Brand[] = Object.values(
  products.reduce<Record<string, Brand>>((acc, p) => {
    const slug = brandSlug(p.brand);
    if (acc[slug]) {
      acc[slug].productCount += 1;
    } else {
      acc[slug] = { slug, name: p.brand, productCount: 1 };
    }
    return acc;
  }, {}),
).sort((a, b) => a.name.localeCompare(b.name));

export const findBrand = (slug: string): Brand | undefined =>
  brands.find((b) => b.slug === slug);

export const productsByBrand = (slug: string): Product[] =>
  products.filter((p) => brandSlug(p.brand) === slug);
