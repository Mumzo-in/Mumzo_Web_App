import type { CategorySlug } from "./category";

/**
 * The canonical product.
 *
 * Previously the storefront and admin each had their own `Product`, built
 * independently against no database, and they disagreed on nearly every field.
 * This is the merge. Notable resolutions:
 *
 * - `images: string[]` (was `img: string` on the storefront, whose carousel
 *   rendered the same image four times). `images[0]` is the primary.
 * - `sizes: ProductSize[]` (was `sizes: string | null` — singular despite the
 *   name — and the storefront ignored it, slicing options off a global array).
 * - `isBestseller` is **manual**. The storefront derived it as `rating >= 4.6`,
 *   which made it uneditable; an admin toggle is the point of having an admin.
 * - `discount` is **derived**, never stored — see `discountPct`. Storing it is
 *   how price and discount drift apart.
 * - `ages`/`type` moved here from the storefront's `product-attributes.ts`,
 *   where they drove live filters but could not be authored.
 */

/** Age bands used for filtering and recommendations. */
export const AGE_GROUPS = [
  { key: "0-6m", label: "0–6 months" },
  { key: "6-12m", label: "6–12 months" },
  { key: "1-2y", label: "1–2 years" },
  { key: "2-4y", label: "2–4 years" },
  { key: "4y+", label: "4+ years" },
  { key: "mom", label: "For mom" },
] as const;

export type AgeGroup = (typeof AGE_GROUPS)[number]["key"];

export const AGE_LABEL: Record<AgeGroup, string> = Object.fromEntries(
  AGE_GROUPS.map((group) => [group.key, group.label]),
) as Record<AgeGroup, string>;

export type ProductStatus = "draft" | "active" | "archived";

/** A purchasable variant. Price and stock are per-size, not per-product. */
export type ProductSize = {
  label: string;
  price: number;
  stock: number;
};

export type Product = {
  id: string;
  /** URL segment on the storefront (`/product/$slug`). */
  slug: string;
  /** Internal stock-keeping code — operators search by this. */
  sku: string;
  name: string;
  brand: string;
  categorySlug: CategorySlug;

  /** Whole rupees. `discount` is derived from these two, never stored. */
  price: number;
  mrp: number;
  /** What we pay the supplier. Drives margin; never exposed to customers. */
  costPrice: number | null;

  /** Pack size as free text — "Pack of 72", "300 g". Rendered on the PDP. */
  qty: string;
  weight: string | null;

  description: string;
  about: string;
  highlights: string[];
  /** Was hardcoded "India" in the storefront's Highlights list. */
  countryOfOrigin: string;

  /** `images[0]` is the primary image. */
  images: string[];
  sizes: ProductSize[];

  ages: AgeGroup[];
  /** Sub-type within a category — "Wipes", "Formula", "Teethers & rattles". */
  type: string;
  tags: string[];

  /** Sum of `sizes[].stock` when sized. Edited via its own endpoint, not the form. */
  stock: number;
  /** Derived from reviews. Read-only in the admin. */
  rating: number;

  isBestseller: boolean;
  status: ProductStatus;
  updatedAt: string;
};

/** Below this, the low-stock chip shows. Mirrors the reorder-point feature. */
export const LOW_STOCK_THRESHOLD = 12;

/**
 * Discount off MRP, rounded. Derived rather than stored so it can never
 * contradict the prices next to it.
 */
export function discountPct(product: Pick<Product, "price" | "mrp">): number {
  if (product.mrp <= 0 || product.mrp <= product.price) {
    return 0;
  }
  return Math.round(((product.mrp - product.price) / product.mrp) * 100);
}

/** A product is buyable only when active and actually in stock. */
export function isPurchasable(
  product: Pick<Product, "status" | "stock">,
): boolean {
  return product.status === "active" && product.stock > 0;
}

export function isLowStock(product: Pick<Product, "stock">): boolean {
  return product.stock > 0 && product.stock <= LOW_STOCK_THRESHOLD;
}

/** Total stock across variants, or the product's own when unsized. */
export function totalStock(product: Pick<Product, "sizes" | "stock">): number {
  if (product.sizes.length === 0) {
    return product.stock;
  }
  return product.sizes.reduce((sum, size) => sum + size.stock, 0);
}

/** Primary image, or null — callers render a placeholder. */
export function primaryImage(product: Pick<Product, "images">): string | null {
  return product.images[0] ?? null;
}

/** Margin over supplier cost, or null when cost is unknown. */
export function marginPct(
  product: Pick<Product, "price" | "costPrice">,
): number | null {
  if (product.costPrice === null || product.costPrice <= 0) {
    return null;
  }
  return Math.round(
    ((product.price - product.costPrice) / product.price) * 100,
  );
}
