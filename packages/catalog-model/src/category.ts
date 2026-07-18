/**
 * The canonical category taxonomy.
 *
 * Reconciles two divergent sets that had drifted apart — the storefront had
 * `baby-essentials, baby-food, baby-shampoo, diapers, clothing, toys, feeding,
 * health, mom-care, nursery`; the admin had `diapering, feeding, bath-skin,
 * mom-care, clothing, toys, gear`. Only four overlapped, so a product created
 * in the admin could not appear on the storefront.
 *
 * Resolution: keep the storefront slugs wherever they existed — they are in
 * live URLs (`/category/$slug`) — and fold the admin's in:
 *   diapering    → diapers
 *   baby-shampoo → bath-skin   (shampoo is bath & skin)
 *   gear         → kept (admin-only concept, no storefront equivalent yet)
 */

export const CATEGORY_SLUGS = [
  "baby-essentials",
  "baby-food",
  "diapers",
  "bath-skin",
  "feeding",
  "clothing",
  "toys",
  "health",
  "mom-care",
  "nursery",
  "gear",
] as const;

export type CategorySlug = (typeof CATEGORY_SLUGS)[number];

export function isCategorySlug(value: unknown): value is CategorySlug {
  return (
    typeof value === "string" &&
    (CATEGORY_SLUGS as readonly string[]).includes(value)
  );
}

/**
 * Slugs retired in the merge, mapped to their replacement. Kept so existing
 * links and any stored data keep resolving instead of 404ing.
 */
export const LEGACY_CATEGORY_SLUGS: Record<string, CategorySlug> = {
  diapering: "diapers",
  "baby-shampoo": "bath-skin",
};

/** Resolves a possibly-legacy slug to a current one, or null if unknown. */
export function resolveCategorySlug(slug: string): CategorySlug | null {
  if (isCategorySlug(slug)) {
    return slug;
  }
  return LEGACY_CATEGORY_SLUGS[slug] ?? null;
}

export type Category = {
  slug: CategorySlug;
  name: string;
  tagline: string;
  /** Hero/tile image for the category. */
  img: string;
  /** Hex wash behind the tile — rendered by the storefront. */
  color: string;
  /** Brand names stocked in this category, denormalized for filters. */
  brands: string[];
  /** Manual merchandising order; `PATCH /admin/categories/reorder`. */
  position: number;
  isActive: boolean;
  /**
   * Whether products here carry sizes. Replaces the storefront's hardcoded
   * `["clothing","diapers","nursery"].includes(slug)` check.
   */
  hasSizes: boolean;
};
