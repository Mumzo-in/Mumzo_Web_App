import { type Product, products } from "@/core/data";

/**
 * Left on the mock catalog: each collection's `productIds` below is a
 * hand-picked list of the *mock* product ids (e.g. "wet-wipes-99"), not
 * real DB ids/slugs. Swapping `productsInCollection` to live data needs each
 * collection re-curated against real seeded product slugs first — a content
 * task, not a wiring one — so it's left for a follow-up pass rather than
 * bundled into this one. Collections aren't on the must-fix browsing path
 * (search/PDP/home rails); worth revisiting once curated.
 */
export interface Collection {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  img: string;
  productIds: string[];
}

export const collections: Collection[] = [
  {
    slug: "newborn-essentials",
    name: "Newborn essentials",
    tagline: "The first-week kit",
    description:
      "Everything you actually need in those first few weeks — gentle, tested and ready in minutes.",
    img: "https://d1rannd7dfx5r5.cloudfront.net/product/90120260089_1.jpg?width=600",
    productIds: [
      "wet-wipes-99",
      "cotton-balls",
      "nappy-cream",
      "pampers-s",
      "onesie-newborn",
      "baby-oil",
    ],
  },
  {
    slug: "bath-time",
    name: "Bath time",
    tagline: "Soft, tear-free, calming",
    description:
      "Gentle cleansers and lotions for delicate skin — everything for a calm, happy bath.",
    img: "https://d1rannd7dfx5r5.cloudfront.net/product/2026-06-25-ecdb751343454.png?width=600",
    productIds: ["baby-shampoo", "body-wash", "baby-lotion", "baby-oil"],
  },
  {
    slug: "starting-solids",
    name: "Starting solids",
    tagline: "From 6 months",
    description:
      "Cereals, purees and feeding gear for the messy, wonderful weaning stage.",
    img: "https://d1rannd7dfx5r5.cloudfront.net/product/401418901001_1.jpg?width=600",
    productIds: [
      "cerelac-rice",
      "ragi-cereal",
      "fruit-puree",
      "baby-snacks",
      "bib-set",
      "sippy-cup",
    ],
  },
  {
    slug: "playtime-picks",
    name: "Playtime picks",
    tagline: "Learn through play",
    description:
      "Safe, sturdy toys that grow with your little one's curiosity.",
    img: "https://images.unsplash.com/photo-1545558014-8692077e9b5c?w=1200&q=75",
    productIds: ["wooden-blocks", "stacking-cups", "rattle-set"],
  },
  {
    slug: "mom-care",
    name: "For mom",
    tagline: "You matter too",
    description: "Because looking after yourself is looking after your baby.",
    img: "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=1200&q=75",
    productIds: ["nursing-pads", "stretch-oil"],
  },
];

export const findCollection = (slug: string): Collection | undefined =>
  collections.find((c) => c.slug === slug);

export const productsInCollection = (slug: string): Product[] => {
  const collection = findCollection(slug);
  if (!collection) return [];
  return collection.productIds
    .map((id) => products.find((p) => p.id === id))
    .filter((p): p is Product => Boolean(p));
};
