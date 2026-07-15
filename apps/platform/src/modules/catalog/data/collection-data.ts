import { type Product, products } from "@/core/data";

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
    img: "https://images.unsplash.com/photo-1519689680058-324335c77eba?w=1200&q=75",
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
    img: "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=1200&q=75",
    productIds: ["baby-shampoo", "body-wash", "baby-lotion", "baby-oil"],
  },
  {
    slug: "starting-solids",
    name: "Starting solids",
    tagline: "From 6 months",
    description:
      "Cereals, purees and feeding gear for the messy, wonderful weaning stage.",
    img: "https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?w=1200&q=75",
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
