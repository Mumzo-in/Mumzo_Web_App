/**
 * Seed products. Fields mirror api-plan §15b so the swap to the real endpoint
 * needs no type changes.
 */

export type ProductStatus = "draft" | "active" | "archived";

export type ProductSize = {
  label: string;
  price: number;
  stock: number;
};

export type AdminProduct = {
  id: string;
  sku: string;
  name: string;
  brand: string;
  categorySlug: string;
  /** Rupees. */
  price: number;
  mrp: number;
  stock: number;
  status: ProductStatus;
  isBestseller: boolean;
  images: string[];
  sizes: ProductSize[];
  tags: string[];
  updatedAt: string;
};

export const PRODUCT_STATUS_META: Record<
  ProductStatus,
  { label: string; tint: string }
> = {
  draft: { label: "Draft", tint: "bg-muted text-muted-foreground" },
  active: { label: "Active", tint: "bg-sage text-ink" },
  archived: { label: "Archived", tint: "bg-secondary text-muted-foreground" },
};

/** Below this, the low-stock chip shows. Mirrors the reorder-point feature. */
export const LOW_STOCK_THRESHOLD = 12;

export const products: AdminProduct[] = [
  {
    id: "prd_001",
    sku: "MZ-DIA-NB-42",
    name: "Ultra-Soft Newborn Diapers — 42 pack",
    brand: "Mumzo Essentials",
    categorySlug: "diapering",
    price: 649,
    mrp: 799,
    stock: 128,
    status: "active",
    isBestseller: true,
    images: [],
    sizes: [
      { label: "NB (42)", price: 649, stock: 128 },
      { label: "S (36)", price: 699, stock: 64 },
    ],
    tags: ["newborn", "bestseller"],
    updatedAt: "2026-07-14T09:12:00.000Z",
  },
  {
    id: "prd_002",
    sku: "MZ-FRM-ST1-400",
    name: "Stage 1 Infant Formula — 400g",
    brand: "NutriBaby",
    categorySlug: "feeding",
    price: 1049,
    mrp: 1199,
    stock: 8,
    status: "active",
    isBestseller: true,
    images: [],
    sizes: [{ label: "400g", price: 1049, stock: 8 }],
    tags: ["formula", "stage-1"],
    updatedAt: "2026-07-15T16:40:00.000Z",
  },
  {
    id: "prd_003",
    sku: "MZ-WIP-72",
    name: "Fragrance-Free Water Wipes — 72 sheets",
    brand: "Mumzo Essentials",
    categorySlug: "diapering",
    price: 199,
    mrp: 249,
    stock: 340,
    status: "active",
    isBestseller: false,
    images: [],
    sizes: [{ label: "72 sheets", price: 199, stock: 340 }],
    tags: ["wipes", "sensitive"],
    updatedAt: "2026-07-12T11:05:00.000Z",
  },
  {
    id: "prd_004",
    sku: "MZ-BTL-ANT-240",
    name: "Anti-Colic Feeding Bottle — 240ml",
    brand: "LittleSip",
    categorySlug: "feeding",
    price: 549,
    mrp: 649,
    stock: 0,
    status: "active",
    isBestseller: false,
    images: [],
    sizes: [
      { label: "150ml", price: 449, stock: 0 },
      { label: "240ml", price: 549, stock: 0 },
    ],
    tags: ["bottle", "anti-colic"],
    updatedAt: "2026-07-16T08:20:00.000Z",
  },
  {
    id: "prd_005",
    sku: "MZ-LOT-BB-200",
    name: "Gentle Baby Lotion — 200ml",
    brand: "Mumzo Care",
    categorySlug: "bath-skin",
    price: 329,
    mrp: 399,
    stock: 76,
    status: "active",
    isBestseller: false,
    images: [],
    sizes: [{ label: "200ml", price: 329, stock: 76 }],
    tags: ["lotion", "sensitive"],
    updatedAt: "2026-07-11T14:00:00.000Z",
  },
  {
    id: "prd_006",
    sku: "MZ-MAT-CRM-100",
    name: "Nipple Care Cream — 100g",
    brand: "Mumzo Care",
    categorySlug: "mom-care",
    price: 449,
    mrp: 525,
    stock: 11,
    status: "active",
    isBestseller: false,
    images: [],
    sizes: [{ label: "100g", price: 449, stock: 11 }],
    tags: ["mom", "nursing"],
    updatedAt: "2026-07-15T10:30:00.000Z",
  },
  {
    id: "prd_007",
    sku: "MZ-TOY-RAT-01",
    name: "Wooden Rattle Set",
    brand: "TinyTouch",
    categorySlug: "toys",
    price: 799,
    mrp: 999,
    stock: 42,
    status: "draft",
    isBestseller: false,
    images: [],
    sizes: [{ label: "Set of 3", price: 799, stock: 42 }],
    tags: ["wooden", "0-6m"],
    updatedAt: "2026-07-16T07:45:00.000Z",
  },
  {
    id: "prd_008",
    sku: "MZ-CLO-ONE-06",
    name: "Organic Cotton Onesie — 0-6m",
    brand: "TinyTouch",
    categorySlug: "clothing",
    price: 599,
    mrp: 749,
    stock: 95,
    status: "active",
    isBestseller: false,
    images: [],
    sizes: [
      { label: "0-3m", price: 599, stock: 48 },
      { label: "3-6m", price: 599, stock: 47 },
    ],
    tags: ["organic", "cotton"],
    updatedAt: "2026-07-10T09:00:00.000Z",
  },
  {
    id: "prd_009",
    sku: "MZ-FRM-ST2-400",
    name: "Stage 2 Follow-Up Formula — 400g",
    brand: "NutriBaby",
    categorySlug: "feeding",
    price: 1099,
    mrp: 1249,
    stock: 54,
    status: "active",
    isBestseller: false,
    images: [],
    sizes: [{ label: "400g", price: 1099, stock: 54 }],
    tags: ["formula", "stage-2"],
    updatedAt: "2026-07-13T13:15:00.000Z",
  },
  {
    id: "prd_010",
    sku: "MZ-BAT-TUB-01",
    name: "Foldable Baby Bath Tub",
    brand: "Mumzo Care",
    categorySlug: "bath-skin",
    price: 1899,
    mrp: 2399,
    stock: 17,
    status: "archived",
    isBestseller: false,
    images: [],
    sizes: [{ label: "Standard", price: 1899, stock: 17 }],
    tags: ["bath", "foldable"],
    updatedAt: "2026-06-28T12:00:00.000Z",
  },
];

export function findProduct(id: string): AdminProduct | undefined {
  return products.find((product) => product.id === id);
}

/** Discount percentage off MRP, rounded — shown on the list and detail. */
export function discountPct(product: AdminProduct): number {
  if (product.mrp <= 0 || product.mrp <= product.price) {
    return 0;
  }
  return Math.round(((product.mrp - product.price) / product.mrp) * 100);
}
