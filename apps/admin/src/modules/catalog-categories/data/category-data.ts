import type { Category } from "@mumzo/catalog-model";

/**
 * Seed categories, shaped by `@mumzo/catalog-model` — api-plan §15c, keyed by
 * `slug` rather than `id`.
 *
 * The slugs are the merged taxonomy (see `packages/catalog-model/src/category.ts`):
 * the admin's `diapering` and `baby-shampoo` are gone, folded into `diapers`
 * and `bath-skin`. `color` and `brands` are back — the storefront renders both
 * and the old admin type had dropped them, so they were uneditable.
 */

export const categories: Category[] = [
  {
    slug: "baby-essentials",
    name: "Baby Essentials",
    tagline: "The everyday basics",
    img: "",
    color: "#FCE1E6",
    brands: ["Mumzo Essentials", "TinyTouch"],
    position: 1,
    isActive: true,
    hasSizes: false,
  },
  {
    slug: "diapers",
    name: "Diapers",
    tagline: "Dry, happy and rash-free",
    img: "",
    color: "#FDE2CE",
    brands: ["Mumzo Essentials"],
    position: 2,
    isActive: true,
    hasSizes: true,
  },
  {
    slug: "baby-food",
    name: "Baby Food",
    tagline: "Formula, purées and first spoons",
    img: "",
    color: "#D8E2D5",
    brands: ["NutriBaby"],
    position: 3,
    isActive: true,
    hasSizes: false,
  },
  {
    slug: "feeding",
    name: "Feeding",
    tagline: "Bottles, bibs and sippers",
    img: "",
    color: "#F6F3EC",
    brands: ["LittleSip"],
    position: 4,
    isActive: true,
    hasSizes: false,
  },
  {
    slug: "bath-skin",
    name: "Bath & Skin",
    tagline: "Gentle on the softest skin",
    img: "",
    color: "#FDF1EC",
    brands: ["Mumzo Care"],
    position: 5,
    isActive: true,
    hasSizes: false,
  },
  {
    slug: "clothing",
    name: "Clothing",
    tagline: "Soft layers for tiny humans",
    img: "",
    color: "#FCE1E6",
    brands: ["TinyTouch"],
    position: 6,
    isActive: true,
    hasSizes: true,
  },
  {
    slug: "toys",
    name: "Toys & Play",
    tagline: "Play that grows with them",
    img: "",
    color: "#D8E2D5",
    brands: ["TinyTouch"],
    position: 7,
    isActive: true,
    hasSizes: false,
  },
  {
    slug: "mom-care",
    name: "Mom Care",
    tagline: "Because you matter too",
    img: "",
    color: "#FDE2CE",
    brands: ["Mumzo Care"],
    position: 8,
    isActive: true,
    hasSizes: false,
  },
  {
    slug: "health",
    name: "Health",
    tagline: "Thermometers, medicine and care",
    img: "",
    color: "#F6F3EC",
    brands: ["Mumzo Care"],
    position: 9,
    isActive: true,
    hasSizes: false,
  },
  {
    slug: "nursery",
    name: "Nursery",
    tagline: "Sleep, soothe and settle",
    img: "",
    color: "#FDF1EC",
    brands: ["TinyTouch"],
    position: 10,
    isActive: true,
    hasSizes: true,
  },
  {
    slug: "gear",
    name: "Baby Gear",
    tagline: "Strollers, carriers and car seats",
    img: "",
    color: "#D8E2D5",
    brands: [],
    position: 11,
    isActive: false,
    hasSizes: false,
  },
];

export function findCategory(slug: string): Category | undefined {
  return categories.find((category) => category.slug === slug);
}

/** Sorted for the merchandising view. */
export function orderedCategories(): Category[] {
  return [...categories].sort((a, b) => a.position - b.position);
}

/** Category options for the product form's select. */
export function categoryOptions(): { value: string; label: string }[] {
  return orderedCategories().map((category) => ({
    value: category.slug,
    label: category.name,
  }));
}
