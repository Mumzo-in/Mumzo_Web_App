/**
 * Category/search listing config — sorters, filter bounds, and the pure
 * filtering logic. Kept as serializable config + pure functions so the
 * SuperAdmin can drive which sorts/filters a category exposes later without
 * touching UI.
 */
import { discountPct } from "@mumzo/schema";
import type { Product } from "@/core/data";
import {
  type AgeGroup,
  agesIn,
  productAges,
  productType,
  typesIn,
} from "./product-attributes";

export type SortKey =
  | "relevance"
  | "price_asc"
  | "price_desc"
  | "discount"
  | "rating";

export interface SortOption {
  key: SortKey;
  label: string;
}

export const SORTS: SortOption[] = [
  { key: "relevance", label: "Recommended" },
  { key: "price_asc", label: "Price: Low to High" },
  { key: "price_desc", label: "Price: High to Low" },
  { key: "discount", label: "Highest discount" },
  { key: "rating", label: "Top rated" },
];

export const PRICE_MIN = 100;
export const PRICE_MAX = 2000;
export const PRICE_STEP = 50;

export type PriceDirection = "above" | "below";

export interface PriceFilter {
  direction: PriceDirection;
  value: number;
}

export interface CategoryFilterState {
  sort: SortKey;
  ages: AgeGroup[];
  brands: string[];
  sizes: string[];
  types: string[];
  price: PriceFilter | null;
}

export const initialFilterState: CategoryFilterState = {
  sort: "relevance",
  ages: [],
  brands: [],
  sizes: [],
  types: [],
  price: null,
};

export interface CategoryFacets {
  ages: AgeGroup[];
  brands: string[];
  sizes: string[];
  types: string[];
}

/**
 * Derive the available filter values from a product list. Facets come from the
 * products themselves so this works for a single category or all of /search.
 */
export function getCategoryFacets(products: Product[]): CategoryFacets {
  const brands = [...new Set(products.map((p) => p.brand))].sort((a, b) =>
    a.localeCompare(b),
  );
  // A product now carries variants, so flatten their labels rather than
  // treating `sizes` as one value per product.
  const sizes = [
    ...new Set(products.flatMap((p) => p.sizes.map((size) => size.label))),
  ].sort((a, b) => a.localeCompare(b));
  return { ages: agesIn(products), brands, sizes, types: typesIn(products) };
}

export function activeFilterCount(state: CategoryFilterState): number {
  return (
    state.ages.length +
    state.brands.length +
    state.sizes.length +
    state.types.length +
    (state.price ? 1 : 0)
  );
}

/** Pure filter + sort — no UI, easy to unit test / reuse (e.g. /search). */
export function applyCategoryFilters(
  products: Product[],
  state: CategoryFilterState,
): Product[] {
  let list = products;
  if (state.price) {
    const { direction, value } = state.price;
    list = list.filter((p) =>
      direction === "above" ? p.price >= value : p.price <= value,
    );
  }

  if (state.ages.length > 0) {
    list = list.filter((p) =>
      productAges(p).some((age) => state.ages.includes(age)),
    );
  }
  if (state.brands.length > 0) {
    list = list.filter((p) => state.brands.includes(p.brand));
  }
  if (state.sizes.length > 0) {
    // Match if the product offers any of the selected sizes.
    list = list.filter((p) =>
      p.sizes.some((size) => state.sizes.includes(size.label)),
    );
  }
  if (state.types.length > 0) {
    list = list.filter((p) => state.types.includes(productType(p)));
  }

  switch (state.sort) {
    case "price_asc":
      return [...list].sort((a, b) => a.price - b.price);
    case "price_desc":
      return [...list].sort((a, b) => b.price - a.price);
    case "discount":
      return [...list].sort((a, b) => discountPct(b) - discountPct(a));
    case "rating":
      return [...list].sort((a, b) => b.rating - a.rating);
    default:
      return list;
  }
}

/**
 * `/search` only — filters the public products API genuinely doesn't
 * support yet (`ages`, `types`: derived client-side from a per-product
 * attribute map, see `product-attributes.ts`, so the API has nothing to
 * filter on). `sort`/`brands`/`sizes`/`maxPrice`/`search`/`categorySlug` are
 * all pushed server-side via `productsQueryOptions` and must NOT be
 * reapplied here — the rows this runs over are already filtered/sorted by
 * the API.
 */
export function applyClientOnlyFilters(
  products: Product[],
  state: Pick<CategoryFilterState, "ages" | "types">,
): Product[] {
  let list = products;

  if (state.ages.length > 0) {
    list = list.filter((p) =>
      productAges(p).some((age) => state.ages.includes(age)),
    );
  }
  if (state.types.length > 0) {
    list = list.filter((p) => state.types.includes(productType(p)));
  }

  return list;
}

export const rupee = (n: number): string =>
  `₹${Math.round(n).toLocaleString("en-IN")}`;
