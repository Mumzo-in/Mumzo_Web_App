import type { Brand } from "../api/brands-api";

/**
 * Baby-product brand fixtures for an Indian D2C context. `productCount` is
 * NOT stored here — it's derived at read time in `brands-api.ts` by counting
 * the product fixtures, so it can never drift out of sync.
 */
export const brands: Omit<Brand, "productCount">[] = [
  {
    id: "brand_lilbud",
    name: "LilBud",
    slug: "lilbud",
    logoUrl: null,
    isActive: true,
  },
  {
    id: "brand_cozynest",
    name: "CozyNest",
    slug: "cozynest",
    logoUrl: null,
    isActive: true,
  },
  {
    id: "brand_babywhiz",
    name: "BabyWhiz",
    slug: "babywhiz",
    logoUrl: null,
    isActive: true,
  },
  {
    id: "brand_tinytoes",
    name: "TinyToes",
    slug: "tinytoes",
    logoUrl: null,
    isActive: true,
  },
  {
    id: "brand_mamaearthly",
    name: "MamaEarthly",
    slug: "mamaearthly",
    logoUrl: null,
    isActive: true,
  },
  {
    id: "brand_snuggleup",
    name: "SnuggleUp",
    slug: "snuggleup",
    logoUrl: null,
    isActive: false,
  },
  {
    id: "brand_babble",
    name: "Babble & Bloom",
    slug: "babble-and-bloom",
    logoUrl: null,
    isActive: true,
  },
];
