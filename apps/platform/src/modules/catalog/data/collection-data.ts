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
    img: "https://d14xdfvauagpvz.cloudfront.net/category_mapper/f7e2f0e6-624e-4e38-b209-8edb7a92c4b6.webp",
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
    img: "https://d14xdfvauagpvz.cloudfront.net/category_mapper/729ae082-b4fd-4919-b357-c49e71140f1a.webp",
    productIds: ["baby-shampoo", "body-wash", "baby-lotion", "baby-oil"],
  },
  {
    slug: "starting-solids",
    name: "Starting solids",
    tagline: "From 6 months",
    description:
      "Cereals, purees and feeding gear for the messy, wonderful weaning stage.",
    img: "https://d14xdfvauagpvz.cloudfront.net/category_mapper/3c944aff-fd76-4190-950f-0e3c6b2efd3f.webp",
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
    img: "https://d14xdfvauagpvz.cloudfront.net/category_mapper/9170a17f-c9d0-49ea-957f-ec6611160712.webp",
    productIds: ["wooden-blocks", "stacking-cups", "rattle-set"],
  },
  {
    slug: "mom-care",
    name: "For mom",
    tagline: "You matter too",
    description: "Because looking after yourself is looking after your baby.",
    img: "https://d14xdfvauagpvz.cloudfront.net/category_mapper/3d1bb2d8-6317-4ef9-b598-c438792919d6.webp",
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
