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

/** `PRODUCT_STATUSES` is the canonical list — zod schemas and the admin
 * form's `<Select>` both derive their options from it instead of repeating
 * the literal tuple. */
export const PRODUCT_STATUSES = [
  "draft",
  "active",
  "inactive",
  "archived",
] as const;

export type ProductStatus = (typeof PRODUCT_STATUSES)[number];

/** Structured measurement category — shown in Basic alongside the free-text
 * `qty` label ("Pack of 72"), which stays free text for the human-readable
 * description. */
export const UNIT_TYPES = [
  { key: "pack", label: "Pack" },
  { key: "weight", label: "Weight" },
  { key: "volume", label: "Volume" },
  { key: "size", label: "Size" },
  { key: "piece", label: "Piece" },
] as const;

export type UnitType = (typeof UNIT_TYPES)[number]["key"];

/** A purchasable variant. Price, MRP, stock, and SKU are per-size, not
 * per-product — a product's own `sku`/`price`/`mrp` are a rollup of its
 * primary (first) variant, kept in sync server-side.
 * `id` identifies the underlying `productSize` row — present when read from
 * the API (needed to add this exact variant to the cart), absent on a
 * freshly-added row in the admin form before it's saved. */
export type ProductSize = {
  id?: string;
  label: string;
  sku: string;
  price: number;
  mrp: number;
  /** What we pay the vendor for this variant. Nullable — not every variant
   * has vendor cost tracked. */
  costPrice: number | null;
  stock: number;
  weightGrams?: number;
  /** Pack size shown on the product page — "Pack of 72", "500 ml". */
  qty: string;
};

/** A color/style variant — same shape as `ProductSize`, but a separate axis
 * (stroller colors, car-seat colors are not sizes). */
export type ProductColor = {
  id?: string;
  label: string;
  sku: string;
  price: number;
  mrp: number;
  costPrice: number | null;
  stock: number;
  weightGrams?: number;
  /** Pack size shown on the product page — "Pack of 72", "500 ml". */
  qty: string;
};

/** "own" — we hold the stock ourselves. "retainer" — vendor holds stock,
 * billed on a standing account. "distributor" — billed per order. */
export type VendorRelationship = "own" | "retainer" | "distributor";

/**
 * Sourcing info — a product has at most one vendor on file. `null` means
 * self-stocked (no `product_vendor` row). Replaces the old flat
 * `vendorId`/`costPrice` columns on `product`.
 */
export type ProductVendor = {
  vendorId: string;
  /** Display name, resolved server-side. */
  vendorName: string;
  relationship: VendorRelationship;
  /** What we pay the supplier for the primary variant. Read-only rollup —
   * the authoritative cost lives per-variant (`ProductSize.costPrice`); this
   * mirrors the primary variant's cost and isn't independently editable.
   * Drives margin; never exposed to customers. */
  costPrice: number | null;
  leadTimeDays: number | null;
  notes: string | null;
};

export type Product = {
  id: string;
  /** URL segment on the storefront (`/product/$slug`). */
  slug: string;
  name: string;
  /** Display name, resolved server-side from `brandId`. */
  brand: string;
  brandId: string;
  /** Sourcing info, or `null` for a self-stocked product. */
  vendor: ProductVendor | null;
  categorySlug: CategorySlug;

  /** Whole rupees, rolled up from the primary (first) variant server-side.
   * `discount` is derived from these two, never stored. */
  price: number;
  mrp: number;

  /** Structured measurement category. */
  unitType: UnitType | null;
  /** Pack size as free text — "Pack of 72", "300 g". Rendered on the product page. */
  qty: string;

  description: string;
  about: string;
  highlights: string[];
  /** Was hardcoded "India" in the storefront's Highlights list. */
  countryOfOrigin: string;

  /** `images[0]` is the primary image. */
  images: string[];
  sizes: ProductSize[];
  colors: ProductColor[];

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

/** Margin over supplier cost, or null when there's no vendor / cost on file. */
export function marginPct(product: {
  price: number;
  vendor: Pick<ProductVendor, "costPrice"> | null;
}): number | null {
  const costPrice = product.vendor?.costPrice ?? null;
  if (costPrice === null || costPrice <= 0) {
    return null;
  }
  return Math.round(((product.price - costPrice) / product.price) * 100);
}
