import {
  CATEGORY_SLUGS,
  type CategorySlug,
  PRODUCT_STATUSES,
  type ProductStatus,
  UNIT_TYPES,
  type UnitType,
} from "@mumzo/schema";
import { z } from "zod";

/** "Baby Bath & Skin" → "baby-bath-skin" — mirrors the category form's slugify. */
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const variantSchema = z
  .object({
    id: z.string().optional(),
    label: z.string(),
    sku: z.string().min(1, "Every variant needs a SKU."),
    price: z.number().positive("Set a selling price."),
    mrp: z.number().positive("Set an MRP."),
    costPrice: z.number().positive().nullable(),
    stock: z.number().min(0, "Stock can't be negative."),
    weightGrams: z.number().min(0, "Weight can't be negative."),
  })
  .refine((data) => data.mrp >= data.price, {
    message: "MRP must be at least the selling price.",
    path: ["mrp"],
  });

/** Mirrors the server's `productWriteSchema` for the fields the form owns —
 * gives every field its own red/error-text state via TanStack Form's
 * onSubmit validator, instead of the old page-level toast pre-checks. */
export const productFormSchema = z.object({
  name: z.string().min(2, "Give the product a name.").max(120),
  slug: z
    .string()
    .min(2, "Slug is required.")
    .max(120)
    .regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers and hyphens only."),
  brandId: z.string().min(1, "Pick a brand."),
  categorySlug: z.enum(CATEGORY_SLUGS, { message: "Pick a category." }),
  type: z.string().min(1, "Set a type — Wipes, Formula…"),
  description: z.string(),
  about: z.string(),
  unitType: z.enum(["", ...UNIT_TYPES.map((unit) => unit.key)]),
  qty: z.string().min(1, "Describe the pack size."),
  weight: z.string(),
  countryOfOrigin: z.string(),
  vendorId: z.string(),
  images: z.array(z.string()),
  uploadSessionId: z.string().nullable(),
  sizes: z
    .array(variantSchema)
    .min(1, "Add at least one variant.")
    .refine(
      (sizes) =>
        new Set(sizes.map((size) => size.sku.trim().toLowerCase())).size ===
        sizes.length,
      { message: "SKUs must be unique." },
    ),
  ages: z.array(z.string()),
  highlights: z.array(z.string()),
  tags: z.array(z.string()),
  status: z.enum(PRODUCT_STATUSES),
  isBestseller: z.boolean(),
});

/** Section-wise sidebar, mirroring the category form's nav pattern. */
export const SECTIONS = [
  {
    id: "basic",
    label: "Basic",
    description:
      "Name, brand, category, tags and everything shown on the product page.",
  },
  {
    id: "stock",
    label: "Stock",
    description: "Vendor, variants, pricing and hub availability.",
  },
  { id: "images", label: "Images", description: "Gallery photos, up to 10." },
] as const;

export type SectionId = (typeof SECTIONS)[number]["id"];

export type ProductSizeInput = {
  id?: string;
  label: string;
  sku: string;
  /** Selling price — what the customer pays. */
  price: number;
  mrp: number;
  /** Buying/cost price from the vendor — drives margin. Nullable, not every
   * variant has vendor cost tracked. */
  costPrice: number | null;
  stock: number;
  weightGrams?: number;
};

export type ProductFormValues = {
  name: string;
  slug: string;
  brandId: string;
  categorySlug: CategorySlug | "";
  type: string;
  description: string;
  about: string;
  unitType: UnitType | "";
  qty: string;
  weight: string;
  countryOfOrigin: string;
  vendorId: string;
  images: string[];
  /** Draft upload session shared by every gallery slot this submit — finalized
   * server-side into permanent keys once the product id is known. */
  uploadSessionId: string | null;
  /** Variants — SKU/price/MRP/stock all live per-row now. The server rolls
   * `product.stock`/`price`/`mrp`/`sku` up from these; there's no separate
   * plain field for any of them. */
  sizes: ProductSizeInput[];
  ages: string[];
  highlights: string[];
  tags: string[];
  status: ProductStatus;
  isBestseller: boolean;
};

export function emptyVariant(): ProductSizeInput {
  return {
    label: "",
    sku: "",
    price: 0,
    mrp: 0,
    costPrice: null,
    stock: 0,
    weightGrams: 0,
  };
}

export function emptyValues(): ProductFormValues {
  return {
    name: "",
    slug: "",
    brandId: "",
    categorySlug: "",
    type: "",
    description: "",
    about: "",
    unitType: "",
    qty: "1 pc",
    weight: "",
    countryOfOrigin: "India",
    vendorId: "",
    images: [],
    uploadSessionId: null,
    sizes: [emptyVariant()],
    ages: [],
    highlights: [],
    tags: [],
    status: "draft",
    isBestseller: false,
  };
}

export const DEFAULT_SIZE_LABEL = "Default";

/** Fills a blank label with "Default" (the single-row, no-real-variants
 * case) before submit — the server requires a non-empty label per row. */
export function normalizeSizes(sizes: ProductSizeInput[]): ProductSizeInput[] {
  return sizes.map((size) => ({
    ...size,
    label: size.label.trim() || DEFAULT_SIZE_LABEL,
  }));
}
