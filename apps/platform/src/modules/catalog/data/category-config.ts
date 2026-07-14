/**
 * Category listing config — sorters, filter bounds, and the pure filtering
 * logic. Kept as serializable config + pure functions so the SuperAdmin can
 * drive which sorts/filters a category exposes later without touching UI.
 */
import type { Category, Product } from "@/core/data";

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

export interface CategoryFilterState {
  sort: SortKey;
  brands: string[];
  sizes: string[];
  maxPrice: number;
}

export const initialFilterState: CategoryFilterState = {
  sort: "relevance",
  brands: [],
  sizes: [],
  maxPrice: PRICE_MAX,
};

export interface CategoryFacets {
  brands: string[];
  sizes: string[];
}

/** Derive the available filter values for a category from its products. */
export function getCategoryFacets(
  category: Category,
  products: Product[],
): CategoryFacets {
  const sizes = [
    ...new Set(
      products.map((p) => p.sizes).filter((s): s is string => Boolean(s)),
    ),
  ];
  return { brands: category.brands, sizes };
}

export function activeFilterCount(state: CategoryFilterState): number {
  return (
    state.brands.length +
    state.sizes.length +
    (state.maxPrice < PRICE_MAX ? 1 : 0)
  );
}

/** Pure filter + sort — no UI, easy to unit test / reuse (e.g. /search). */
export function applyCategoryFilters(
  products: Product[],
  state: CategoryFilterState,
): Product[] {
  let list = products.filter((p) => p.price <= state.maxPrice);
  if (state.brands.length > 0) {
    list = list.filter((p) => state.brands.includes(p.brand));
  }
  if (state.sizes.length > 0) {
    list = list.filter(
      (p) => p.sizes !== null && state.sizes.includes(p.sizes),
    );
  }
  switch (state.sort) {
    case "price_asc":
      return [...list].sort((a, b) => a.price - b.price);
    case "price_desc":
      return [...list].sort((a, b) => b.price - a.price);
    case "discount":
      return [...list].sort((a, b) => b.discount - a.discount);
    case "rating":
      return [...list].sort((a, b) => b.rating - a.rating);
    default:
      return list;
  }
}

export const rupee = (n: number): string =>
  `₹${Math.round(n).toLocaleString("en-IN")}`;
