import {
  type Category,
  type CategorySlug,
  type Product,
  slugify,
} from "@mumzo/schema";

// Re-exported so the 17 existing `@/core/data` importers keep working — the
// types just come from the shared model now.
export type { Category, CategorySlug, Product };

/**
 * Mock product catalogue for the storefront. Categories used to live here
 * too but are now fetched live — see `@/modules/catalog`'s
 * `categoriesQueryOptions` (backed by `GET /api/v1/categories`).
 *
 * Products are now live too, for the core catalog-browsing path (home
 * rails, `/search`, PDP, related products) — see `@/modules/catalog`'s
 * `productsQueryOptions`/`productQueryOptions`/`productsByCategoryQueryOptions`
 * (backed by `GET /api/v1/products`) and `toProduct()`, which adapts the
 * public wire shape into this same `Product` type so `ProductCard`/cart/
 * wishlist don't need to change.
 *
 * What's left on this mock array: cart, wishlist, coupons/offers and order
 * history — those are still mock end-to-end (no real cart/order persisted
 * yet), so resolving a mock cart-item/order-line id to a `Product` for
 * display still goes through `findProduct`/`productsInCategory` here. Wiring
 * those to live data is follow-up work once carts/orders are real.
 *
 * Types now come from `@mumzo/schema` — the same shape the admin
 * authors — so a product created in the admin is one this app can render.
 * Previously each app had its own `Product` and they disagreed on nearly
 * every field.
 *
 * `Offer` stays local for now; it is being reconciled with the admin's
 * `AdminCoupon` separately.
 */

export interface Offer {
  code: string;
  desc: string;
  discount?: number;
  minAmt?: number;
  pct?: number;
  cap?: number;
  category?: string;
}

/**
 * Builds a mock product. Keeps the original call signature so the 34 entries
 * below are untouched; fields the mock data never carried (about, highlights,
 * stock…) get sensible defaults until the API supplies them.
 */
const P = (
  id: string,
  categorySlug: CategorySlug,
  name: string,
  brand: string,
  price: number,
  mrp: number,
  qty: string,
  size: string | null,
  img: string,
  rating = 4.5,
  stock = 40,
): Product => ({
  id,
  slug: slugify(name),
  categorySlug,
  name,
  brand,
  // Mock-only stand-in — the platform doesn't read from the real `brand`
  // table yet (see docs/roadmap.md, Module 1 phase 2). A real brandId is a
  // DB uuid; this just keeps the mock Product shape valid until then.
  brandId: slugify(brand),
  vendor: null,
  price,
  mrp,
  unitType: null,
  qty,
  description: "",
  about: "",
  highlights: [],
  countryOfOrigin: "India",
  images: [img],
  // The old mock carried a single `size` string; the model wants variants.
  sizes: size
    ? [
        {
          label: size,
          price,
          stock,
          sku: `${id}-${size}`,
          mrp,
          costPrice: null,
          qty,
        },
      ]
    : [],
  colors: [],
  ages: [],
  type: "",
  tags: [],
  stock,
  rating,
  isBestseller: rating >= 4.6,
  isTopDeal: false,
  status: "active",
  updatedAt: "2026-07-01T00:00:00.000Z",
});

export const products: Product[] = [
  // Baby essentials
  P(
    "wet-wipes-99",
    "baby-essentials",
    "Water Wipes, 99% Water",
    "Pampers",
    249,
    349,
    "Pack of 72",
    null,
    "https://d1rannd7dfx5r5.cloudfront.net/product/2025-09-06-68bc04e289a2c.png?width=340",
    4.7,
  ),
  P(
    "cotton-balls",
    "baby-essentials",
    "Organic Cotton Balls",
    "Mumzo",
    120,
    160,
    "100 pcs",
    null,
    "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=600&q=75",
    4.4,
  ),
  P(
    "hand-sanitiser",
    "baby-essentials",
    "Gentle Hand Sanitiser",
    "Himalaya",
    89,
    120,
    "100 ml",
    null,
    "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=600&q=75",
    4.3,
  ),
  P(
    "nappy-cream",
    "baby-essentials",
    "Nappy Rash Cream",
    "Sebamed",
    299,
    399,
    "50 g",
    null,
    "https://d1rannd7dfx5r5.cloudfront.net/product/2026-06-25-ecdb751343454.png?width=340",
    4.6,
  ),

  // Baby food
  P(
    "cerelac-rice",
    "baby-food",
    "Cerelac Rice (6M+)",
    "Nestlé",
    275,
    320,
    "300 g",
    null,
    "https://images.unsplash.com/photo-1633306002612-cbb98bb0a65d?w=600&q=75",
    4.6,
  ),
  P(
    "ragi-cereal",
    "baby-food",
    "Millet Ragi Cereal",
    "Slurrp Farm",
    349,
    425,
    "250 g",
    null,
    "https://images.unsplash.com/photo-1633306002612-cbb98bb0a65d?w=600&q=75",
    4.7,
  ),
  P(
    "fruit-puree",
    "baby-food",
    "Organic Apple Purée",
    "Gerber",
    129,
    165,
    "125 g",
    null,
    "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=600&q=75",
    4.5,
  ),
  P(
    "infant-formula",
    "baby-food",
    "Stage 1 Infant Formula",
    "Nestlé",
    749,
    899,
    "400 g",
    null,
    "https://images.unsplash.com/photo-1580982172477-8f36f9c96b3d?w=600&q=75",
    4.4,
  ),
  P(
    "baby-snacks",
    "baby-food",
    "Toddler Puffs Blueberry",
    "Timios",
    199,
    249,
    "50 g",
    null,
    "https://images.unsplash.com/photo-1633306002612-cbb98bb0a65d?w=600&q=75",
    4.6,
  ),

  // Bath & shampoo
  P(
    "bath-skin",
    "bath-skin",
    "No-Tear Baby Shampoo",
    "Johnson's",
    189,
    240,
    "200 ml",
    null,
    "https://images.unsplash.com/photo-1616627454801-51b7c37ac547?w=600&q=75",
    4.5,
  ),
  P(
    "body-wash",
    "bath-skin",
    "Gentle Body Wash",
    "Mamaearth",
    249,
    320,
    "400 ml",
    null,
    "https://images.unsplash.com/photo-1616627454801-51b7c37ac547?w=600&q=75",
    4.7,
  ),
  P(
    "baby-lotion",
    "bath-skin",
    "Moisturising Lotion",
    "Sebamed",
    429,
    550,
    "200 ml",
    null,
    "https://images.unsplash.com/photo-1616627454801-51b7c37ac547?w=600&q=75",
    4.6,
  ),
  P(
    "baby-oil",
    "bath-skin",
    "Massage Oil",
    "The Moms Co.",
    349,
    449,
    "200 ml",
    null,
    "https://images.unsplash.com/photo-1616627454801-51b7c37ac547?w=600&q=75",
    4.5,
  ),

  // Diapers
  P(
    "pampers-s",
    "diapers",
    "Premium Care Diapers S",
    "Pampers",
    499,
    649,
    "Pack of 46",
    "S",
    "https://d1rannd7dfx5r5.cloudfront.net/product/90120260089_1.jpg?width=340",
    4.7,
  ),
  P(
    "pampers-m",
    "diapers",
    "Premium Care Diapers M",
    "Pampers",
    599,
    749,
    "Pack of 44",
    "M",
    "https://d1rannd7dfx5r5.cloudfront.net/product/90120260089_2.jpg?width=340",
    4.7,
  ),
  P(
    "huggies-l",
    "diapers",
    "Wonder Pants L",
    "Huggies",
    699,
    849,
    "Pack of 34",
    "L",
    "https://d1rannd7dfx5r5.cloudfront.net/product/1014_1.webp?width=340",
    4.6,
  ),
  P(
    "mamypoko-xl",
    "diapers",
    "Extra Absorb Pants XL",
    "MamyPoko",
    749,
    899,
    "Pack of 30",
    "XL",
    "https://d1rannd7dfx5r5.cloudfront.net/product/6808_1.jpg?width=340",
    4.5,
  ),

  // Clothing
  P(
    "onesie-newborn",
    "clothing",
    "Organic Cotton Onesie",
    "Mini Klub",
    449,
    599,
    "Pack of 3",
    "0-3M",
    "https://images.unsplash.com/photo-1622290319146-7b63df48a635?w=600&q=75",
    4.6,
  ),
  P(
    "romper-set",
    "clothing",
    "Sleep & Play Romper",
    "Carter's",
    799,
    999,
    "Set of 2",
    "6-9M",
    "https://images.unsplash.com/photo-1622290319146-7b63df48a635?w=600&q=75",
    4.7,
  ),
  P(
    "frock-set",
    "clothing",
    "Summer Frock Set",
    "Mothercare",
    899,
    1199,
    "1 pc",
    "1-2Y",
    "https://images.unsplash.com/photo-1622290319146-7b63df48a635?w=600&q=75",
    4.5,
  ),

  // Toys
  P(
    "wooden-blocks",
    "toys",
    "Wooden Building Blocks",
    "Skola",
    649,
    899,
    "30 pcs",
    null,
    "https://images.unsplash.com/photo-1600978398568-48175fd97cce?w=600&q=75",
    4.7,
  ),
  P(
    "stacking-cups",
    "toys",
    "Rainbow Stacking Cups",
    "Fisher-Price",
    399,
    499,
    "1 set",
    null,
    "https://images.unsplash.com/photo-1600978398568-48175fd97cce?w=600&q=75",
    4.5,
  ),
  P(
    "rattle-set",
    "toys",
    "Silicone Teether Set",
    "Chicco",
    299,
    399,
    "3 pcs",
    null,
    "https://images.unsplash.com/photo-1600978398568-48175fd97cce?w=600&q=75",
    4.4,
  ),

  // Feeding
  P(
    "bottle-avent",
    "feeding",
    "Natural Response Bottle",
    "Philips Avent",
    549,
    699,
    "260 ml",
    null,
    "https://images.unsplash.com/photo-1580982172477-8f36f9c96b3d?w=600&q=75",
    4.7,
  ),
  P(
    "bib-set",
    "feeding",
    "Silicone Feeding Bibs",
    "MAM",
    299,
    399,
    "Set of 3",
    null,
    "https://images.unsplash.com/photo-1580982172477-8f36f9c96b3d?w=600&q=75",
    4.5,
  ),
  P(
    "sippy-cup",
    "feeding",
    "Non-Spill Sippy Cup",
    "Chicco",
    349,
    449,
    "220 ml",
    null,
    "https://images.unsplash.com/photo-1580982172477-8f36f9c96b3d?w=600&q=75",
    4.4,
  ),

  // Health
  P(
    "thermometer",
    "health",
    "Digital Ear Thermometer",
    "Chicco",
    1499,
    1899,
    "1 pc",
    null,
    "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=600&q=75",
    4.6,
  ),
  P(
    "nasal-drops",
    "health",
    "Saline Nasal Drops",
    "Himalaya",
    79,
    99,
    "10 ml",
    null,
    "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=600&q=75",
    4.3,
  ),

  // Mom care
  P(
    "nursing-pads",
    "mom-care",
    "Disposable Nursing Pads",
    "The Moms Co.",
    299,
    399,
    "Pack of 60",
    null,
    "https://images.unsplash.com/photo-1522008693277-086ad6075b78?w=600&q=75",
    4.5,
  ),
  P(
    "stretch-oil",
    "mom-care",
    "Stretch Mark Oil",
    "Mamaearth",
    449,
    599,
    "150 ml",
    null,
    "https://images.unsplash.com/photo-1522008693277-086ad6075b78?w=600&q=75",
    4.6,
  ),

  // Nursery
  P(
    "swaddle-blanket",
    "nursery",
    "Muslin Swaddle Blanket",
    "Mee Mee",
    649,
    899,
    "Set of 3",
    null,
    "https://d1rannd7dfx5r5.cloudfront.net/product/3119_2.webp?width=340",
    4.7,
  ),
  P(
    "sleep-suit",
    "nursery",
    "Winter Sleep Suit",
    "Mothercare",
    899,
    1199,
    "1 pc",
    "3-6M",
    "https://d1rannd7dfx5r5.cloudfront.net/product/3119_1.webp?width=340",
    4.5,
  ),
];

export const offers: Offer[] = [
  {
    code: "MUMZO50",
    desc: "Flat ₹50 off on orders above ₹499",
    discount: 50,
    minAmt: 499,
  },
  {
    code: "FIRST10",
    desc: "10% off on first order (up to ₹100)",
    pct: 10,
    cap: 100,
  },
  {
    code: "BABY100",
    desc: "Flat ₹100 off on baby food above ₹700",
    discount: 100,
    minAmt: 700,
    category: "baby-food",
  },
];

// `findCategory` was removed once every importer moved to the live
// `categoriesQueryOptions` in `@/modules/catalog` (backed by
// `GET /api/v1/categories`) — see that module's `api/categories-api.ts`.

export const findProduct = (id: string): Product | undefined =>
  products.find((p) => p.id === id);

export const productsInCategory = (slug: string): Product[] =>
  products.filter((p) => p.categorySlug === slug);
