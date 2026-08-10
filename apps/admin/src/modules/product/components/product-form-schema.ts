import {
  CATEGORY_SLUGS,
  type CategorySlug,
  PRODUCT_STATUSES,
  type ProductStatus,
  UNIT_TYPES,
  type UnitType,
} from "@mumzo/schema";
import { z } from "zod";

const variantSchema = z
  .object({
    id: z.string().optional(),
    label: z.string(),
    sku: z.string().min(1, "Every variant needs a SKU."),
    price: z.number().positive("Set a selling price."),
    mrp: z.number().positive("Set an MRP."),
    costPrice: z.number().positive().nullable(),
    weightGrams: z.number().min(0, "Weight can't be negative.").optional(),
    qty: z.string().min(1, "Describe the pack size."),
  })
  .refine((data) => data.mrp >= data.price, {
    message: "MRP must be at least the selling price.",
    path: ["mrp"],
  });

/** Mirrors the server's `productWriteSchema` for the fields the form owns —
 * gives every field its own red/error-text state via TanStack Form's
 * onSubmit validator, instead of the old page-level toast pre-checks.
 *
 * `status`/`isBestseller`/`isTopDeal` are deliberately NOT validated here —
 * they're driven by page-level `useState` + `ProductSettingsMenu`, outside
 * the form tree entirely (no `<Field>`, no error UI), and the page's submit
 * handler overwrites them onto the network payload after `form.handleSubmit`
 * resolves. Validating them against the form's `value` here would check a
 * stale snapshot from mount, not the live toggle state — exactly the bug
 * that made the settings-menu switches appear not to "take": the form's
 * onSubmit validator rejected the (accurate, but frozen-at-mount) snapshot
 * before the page's live state ever got a chance to override it. */
export const productFormSchema = z.object({
  name: z.string().min(2, "Give the product a name.").max(120),
  brandId: z.string().min(1, "Pick a brand."),
  categorySlug: z.enum(CATEGORY_SLUGS, { message: "Pick a category." }),
  type: z.string().min(1, "Set a type — Wipes, Formula…"),
  description: z.string(),
  about: z.string(),
  unitType: z.enum(["", ...UNIT_TYPES.map((unit) => unit.key)]),
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
  isTopDeal: z.boolean(),
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
  weightGrams?: number;
  /** Pack size shown on the product page — "Pack of 72", "500 ml". */
  qty: string;
};

export type ProductFormValues = {
  name: string;
  brandId: string;
  categorySlug: CategorySlug | "";
  type: string;
  description: string;
  about: string;
  unitType: UnitType | "";
  countryOfOrigin: string;
  vendorId: string;
  images: string[];
  /** Draft upload session shared by every gallery slot this submit — finalized
   * server-side into permanent keys once the product id is known. */
  uploadSessionId: string | null;
  /** Variants — SKU/price/MRP live per-row. The server rolls
   * `product.price`/`mrp`/`sku` up from these; there's no separate plain
   * field for any of them. Stock isn't here — it lives only in per-hub
   * `inventory`, set via "Update stock" / hub availability. */
  sizes: ProductSizeInput[];
  ages: string[];
  highlights: string[];
  tags: string[];
  status: ProductStatus;
  isBestseller: boolean;
  isTopDeal: boolean;
};

/** Maps each top-level form field to the section nav tab it's rendered in, so
 * a validation error on a field in a hidden section can still be surfaced —
 * sections other than the active one aren't mounted, so their field errors
 * are otherwise invisible. */
export const FIELD_SECTIONS: Record<keyof ProductFormValues, SectionId> = {
  name: "basic",
  brandId: "basic",
  categorySlug: "basic",
  type: "basic",
  description: "basic",
  about: "basic",
  unitType: "basic",
  ages: "basic",
  highlights: "basic",
  tags: "basic",
  countryOfOrigin: "stock",
  vendorId: "stock",
  sizes: "stock",
  status: "basic",
  isBestseller: "basic",
  isTopDeal: "basic",
  images: "images",
  uploadSessionId: "images",
};

export function emptyVariant(): ProductSizeInput {
  return {
    label: "",
    sku: "",
    price: 0,
    mrp: 0,
    costPrice: null,
    weightGrams: 0,
    qty: "1 pc",
  };
}

export function emptyValues(): ProductFormValues {
  return {
    name: "",
    brandId: "",
    categorySlug: "",
    type: "",
    description: "",
    about: "",
    unitType: "",
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
    isTopDeal: false,
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
