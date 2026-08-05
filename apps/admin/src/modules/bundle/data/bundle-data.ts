import type { Bundle, BundleStatus } from "@mumzo/schema";

/** Same draft/active/inactive/archived lifecycle and tints as products —
 * see `PRODUCT_STATUS_META`. Kept as its own copy rather than a shared
 * import so a bundle-specific tint can diverge later without touching the
 * product table. */
export const BUNDLE_STATUS_META: Record<
  BundleStatus,
  { label: string; tint: string }
> = {
  draft: { label: "Draft", tint: "bg-muted text-muted-foreground" },
  active: { label: "Active", tint: "bg-sage text-ink" },
  inactive: { label: "Inactive", tint: "bg-accent text-ink" },
  archived: { label: "Archived", tint: "bg-secondary text-muted-foreground" },
};

/**
 * Bundle fixtures. `items[]` reference real product fixture ids so the
 * bundle-editor's product picker and price-savings math resolve correctly.
 * Item name/slug/image/price are denormalized copies — the server resolves
 * these from the product on write, mocked here by hand.
 */
export const bundles: Bundle[] = [
  {
    id: "bdl_newborn_starter",
    slug: "newborn-starter-kit",
    name: "Newborn Starter Kit",
    description: "Everything for the first weeks home.",
    price: 1499,
    images: ["/bundles/newborn-starter-1.jpg"],
    status: "active",
    items: [
      {
        productId: "prd_diaper_newborn",
        productName: "Newborn Diapers, Ultra Soft",
        productSlug: "babywhiz-newborn-diapers-pack-of-60",
        productImage: "/products/diapers-newborn-1.jpg",
        productPrice: 449,
        quantity: 1,
      },
      {
        productId: "prd_wipes_gentle",
        productName: "Gentle Baby Wipes",
        productSlug: "tinytoes-gentle-baby-wipes",
        productImage: "/products/wipes-1.jpg",
        productPrice: 199,
        quantity: 2,
      },
      {
        productId: "prd_swaddle_muslin",
        productName: "Muslin Swaddle Set (3 pcs)",
        productSlug: "cozynest-muslin-swaddle-set",
        productImage: "/products/swaddle-1.jpg",
        productPrice: 799,
        quantity: 1,
      },
    ],
    createdAt: "2026-06-01T10:00:00.000Z",
    updatedAt: "2026-07-18T10:00:00.000Z",
  },
  {
    id: "bdl_feeding_essentials",
    slug: "feeding-essentials-combo",
    name: "Feeding Essentials Combo",
    description: "Bottle, bib and cleanser bundled together.",
    price: 699,
    images: ["/bundles/feeding-essentials-1.jpg"],
    status: "active",
    items: [
      {
        productId: "prd_bottle_anticolic",
        productName: "Anti-Colic Feeding Bottle 250ml",
        productSlug: "lilbud-anti-colic-feeding-bottle",
        productImage: "/products/bottle-1.jpg",
        productPrice: 399,
        quantity: 1,
      },
      {
        productId: "prd_bib_silicone",
        productName: "Silicone Catch-All Bib",
        productSlug: "lilbud-silicone-bib",
        productImage: "/products/bib-1.jpg",
        productPrice: 249,
        quantity: 1,
      },
    ],
    createdAt: "2026-06-10T10:00:00.000Z",
    updatedAt: "2026-07-01T10:00:00.000Z",
  },
  {
    id: "bdl_mom_care",
    slug: "mom-comfort-combo",
    name: "Mom Comfort Combo",
    description: "Maternity belt and stretch mark cream.",
    price: 1149,
    images: ["/bundles/mom-comfort-1.jpg"],
    status: "draft",
    items: [
      {
        productId: "prd_maternity_belt",
        productName: "Maternity Support Belt",
        productSlug: "babble-and-bloom-maternity-support-belt",
        productImage: "/products/maternity-belt-1.jpg",
        productPrice: 699,
        quantity: 1,
      },
      {
        productId: "prd_maternity_cream",
        productName: "Stretch Mark Cream",
        productSlug: "babble-and-bloom-stretch-mark-cream",
        productImage: "/products/stretch-cream-1.jpg",
        productPrice: 549,
        quantity: 1,
      },
    ],
    createdAt: "2026-07-20T10:00:00.000Z",
    updatedAt: "2026-07-28T10:00:00.000Z",
  },
  {
    id: "bdl_bath_time",
    slug: "bath-time-duo",
    name: "Bath Time Duo",
    description: "Shampoo and lotion for a gentle bath routine.",
    price: 429,
    images: ["/bundles/bath-time-1.jpg"],
    status: "inactive",
    items: [
      {
        productId: "prd_shampoo_notears",
        productName: "No More Tears Baby Shampoo",
        productSlug: "cozynest-no-tears-shampoo",
        productImage: "/products/shampoo-1.jpg",
        productPrice: 249,
        quantity: 1,
      },
      {
        productId: "prd_lotion_moisture",
        productName: "Daily Moisture Baby Lotion",
        productSlug: "cozynest-daily-moisture-lotion",
        productImage: "/products/lotion-1.jpg",
        productPrice: 229,
        quantity: 1,
      },
    ],
    createdAt: "2026-04-15T10:00:00.000Z",
    updatedAt: "2026-05-12T10:00:00.000Z",
  },
];
