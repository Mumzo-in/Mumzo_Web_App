/** Categories — api-plan §15c. Keyed by `slug`, not `id`. */

export type AdminCategory = {
  slug: string;
  name: string;
  tagline: string;
  /** Manual merchandising order; `PATCH /admin/categories/reorder`. */
  position: number;
  productCount: number;
  isActive: boolean;
  image: string | null;
};

export const categories: AdminCategory[] = [
  {
    slug: "diapering",
    name: "Diapering",
    tagline: "Dry, happy and rash-free",
    position: 1,
    productCount: 48,
    isActive: true,
    image: null,
  },
  {
    slug: "feeding",
    name: "Feeding",
    tagline: "Formula, bottles and everything in between",
    position: 2,
    productCount: 62,
    isActive: true,
    image: null,
  },
  {
    slug: "bath-skin",
    name: "Bath & Skin",
    tagline: "Gentle on the softest skin",
    position: 3,
    productCount: 37,
    isActive: true,
    image: null,
  },
  {
    slug: "mom-care",
    name: "Mom Care",
    tagline: "Because you matter too",
    position: 4,
    productCount: 29,
    isActive: true,
    image: null,
  },
  {
    slug: "clothing",
    name: "Clothing",
    tagline: "Soft layers for tiny humans",
    position: 5,
    productCount: 54,
    isActive: true,
    image: null,
  },
  {
    slug: "toys",
    name: "Toys & Play",
    tagline: "Play that grows with them",
    position: 6,
    productCount: 41,
    isActive: true,
    image: null,
  },
  {
    slug: "gear",
    name: "Baby Gear",
    tagline: "Strollers, carriers and car seats",
    position: 7,
    productCount: 18,
    isActive: false,
    image: null,
  },
];

export function findCategory(slug: string): AdminCategory | undefined {
  return categories.find((category) => category.slug === slug);
}

/** Sorted for the merchandising view. */
export function orderedCategories(): AdminCategory[] {
  return [...categories].sort((a, b) => a.position - b.position);
}
