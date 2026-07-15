/**
 * Age-group and product-type attributes.
 *
 * These aren't fields on the mock `Product` yet — they'll come from the API
 * later. Until then they're modelled here as an explicit per-product map with
 * a category-level fallback, so the filters have real data to work against.
 */
import type { Product } from "@/core/data";

export type AgeGroup = "0-6m" | "6-12m" | "1-2y" | "2-4y" | "4y+" | "mom";

export const AGE_GROUPS: { key: AgeGroup; label: string }[] = [
  { key: "0-6m", label: "0–6 months" },
  { key: "6-12m", label: "6–12 months" },
  { key: "1-2y", label: "1–2 years" },
  { key: "2-4y", label: "2–4 years" },
  { key: "4y+", label: "4+ years" },
  { key: "mom", label: "For mom" },
];

export const AGE_LABEL: Record<AgeGroup, string> = AGE_GROUPS.reduce(
  (acc, g) => {
    acc[g.key] = g.label;
    return acc;
  },
  {} as Record<AgeGroup, string>,
);

interface ProductAttrs {
  ages: AgeGroup[];
  type: string;
}

/** Fallback when a product has no explicit entry. */
const CATEGORY_FALLBACK: Record<string, ProductAttrs> = {
  "baby-essentials": { ages: ["0-6m", "6-12m", "1-2y"], type: "Essentials" },
  "baby-food": { ages: ["6-12m", "1-2y"], type: "Food" },
  "baby-shampoo": { ages: ["0-6m", "6-12m", "1-2y"], type: "Bath & skincare" },
  diapers: { ages: ["0-6m"], type: "Diapers" },
  clothing: { ages: ["0-6m"], type: "Clothing" },
  toys: { ages: ["6-12m", "1-2y"], type: "Toys" },
  feeding: { ages: ["0-6m", "6-12m"], type: "Feeding" },
  health: { ages: ["0-6m", "6-12m", "1-2y", "2-4y"], type: "Health" },
  "mom-care": { ages: ["mom"], type: "Mom care" },
};

const PRODUCT_ATTRS: Record<string, ProductAttrs> = {
  // Baby essentials
  "wet-wipes-99": { ages: ["0-6m", "6-12m", "1-2y", "2-4y"], type: "Wipes" },
  "cotton-balls": { ages: ["0-6m", "6-12m"], type: "Cotton & swabs" },
  "hand-sanitiser": { ages: ["1-2y", "2-4y", "4y+", "mom"], type: "Hygiene" },
  "nappy-cream": { ages: ["0-6m", "6-12m"], type: "Skincare" },

  // Baby food
  "cerelac-rice": { ages: ["6-12m"], type: "Cereal" },
  "ragi-cereal": { ages: ["6-12m", "1-2y"], type: "Cereal" },
  "fruit-puree": { ages: ["6-12m"], type: "Purée" },
  "infant-formula": { ages: ["0-6m"], type: "Formula" },
  "baby-snacks": { ages: ["1-2y", "2-4y"], type: "Snacks" },

  // Bath & skincare
  "baby-shampoo": { ages: ["0-6m", "6-12m", "1-2y", "2-4y"], type: "Shampoo" },
  "body-wash": { ages: ["0-6m", "6-12m", "1-2y", "2-4y"], type: "Body wash" },
  "baby-lotion": { ages: ["0-6m", "6-12m", "1-2y"], type: "Lotion" },
  "baby-oil": { ages: ["0-6m", "6-12m"], type: "Massage oil" },

  // Diapers — size maps to age
  "pampers-s": { ages: ["0-6m"], type: "Taped diapers" },
  "pampers-m": { ages: ["6-12m"], type: "Taped diapers" },
  "huggies-l": { ages: ["1-2y"], type: "Pant diapers" },
  "mamypoko-xl": { ages: ["2-4y"], type: "Pant diapers" },

  // Clothing
  "onesie-newborn": { ages: ["0-6m"], type: "Onesies" },
  "romper-set": { ages: ["6-12m"], type: "Rompers" },
  "frock-set": { ages: ["1-2y"], type: "Dresses" },

  // Toys
  "wooden-blocks": { ages: ["1-2y", "2-4y"], type: "Learning toys" },
  "stacking-cups": { ages: ["6-12m", "1-2y"], type: "Learning toys" },
  "rattle-set": { ages: ["0-6m", "6-12m"], type: "Teethers & rattles" },

  // Feeding
  "bottle-avent": { ages: ["0-6m", "6-12m"], type: "Bottles" },
  "bib-set": { ages: ["6-12m", "1-2y"], type: "Bibs" },
  "sippy-cup": { ages: ["1-2y", "2-4y"], type: "Sippers" },

  // Health
  thermometer: {
    ages: ["0-6m", "6-12m", "1-2y", "2-4y", "4y+"],
    type: "Devices",
  },
  "nasal-drops": { ages: ["0-6m", "6-12m", "1-2y"], type: "Medicine" },

  // Mom care
  "nursing-pads": { ages: ["mom"], type: "Nursing" },
  "stretch-oil": { ages: ["mom"], type: "Body care" },
};

const attrsFor = (product: Product): ProductAttrs =>
  PRODUCT_ATTRS[product.id] ??
  CATEGORY_FALLBACK[product.categorySlug] ?? { ages: [], type: "Other" };

export const productAges = (product: Product): AgeGroup[] =>
  attrsFor(product).ages;

export const productType = (product: Product): string => attrsFor(product).type;

/** Distinct types present in a product list, in AGE_GROUPS-style order. */
export const typesIn = (products: Product[]): string[] =>
  [...new Set(products.map(productType))].sort((a, b) => a.localeCompare(b));

/** Age groups present in a product list, kept in canonical order. */
export const agesIn = (products: Product[]): AgeGroup[] => {
  const present = new Set(products.flatMap(productAges));
  return AGE_GROUPS.filter((g) => present.has(g.key)).map((g) => g.key);
};
