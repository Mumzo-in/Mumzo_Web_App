import z from "zod";
import { CATEGORY_SLUGS } from "./category";
import { AGE_GROUPS, PRODUCT_STATUSES } from "./product";

/**
 * Validation for authoring products. Lives beside the model so the admin form
 * and the (unbuilt) API validate identically instead of drifting.
 *
 * Excludes `stock`, `rating`, and `updatedAt`: stock has its own endpoint
 * (`PATCH /admin/products/:id/stock`) because it needs an audit reason, rating
 * is derived from reviews, and updatedAt is server-owned.
 */

const ageKeys = AGE_GROUPS.map((group) => group.key) as [string, ...string[]];

export const productSizeSchema = z.object({
  label: z.string().min(1, "Give the size a label."),
  price: z.number().int().positive("Price must be more than zero."),
  stock: z.number().int().min(0, "Stock can't be negative."),
});

/** Same shape as `productSizeSchema` — a separate axis (color/style) rather
 * than a size. */
export const productColorSchema = z.object({
  label: z.string().min(1, "Give the color a label."),
  price: z.number().int().positive("Price must be more than zero."),
  stock: z.number().int().min(0, "Stock can't be negative."),
});

/** Sourcing info the Sourcing tab collects. `null` = self-stocked. */
export const productVendorSchema = z
  .object({
    vendorId: z.string().min(1, "Pick a vendor."),
    relationship: z.enum(["own", "retainer", "distributor"]),
    costPrice: z.number().int().positive().nullable().default(null),
    leadTimeDays: z.number().int().min(0).nullable().default(null),
    notes: z.string().max(2000).nullable().default(null),
  })
  .nullable();

export const productFormSchema = z
  .object({
    name: z.string().min(2, "Name is too short.").max(120),
    slug: z
      .string()
      .min(2)
      .regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers and hyphens only."),
    sku: z.string().min(2, "SKU is required.").max(40),
    brandId: z.string().min(1, "Pick a brand."),
    vendor: productVendorSchema.default(null),
    categorySlug: z.enum(CATEGORY_SLUGS),
    status: z.enum(PRODUCT_STATUSES),

    price: z.number().int().positive("Price must be more than zero."),
    mrp: z.number().int().positive("MRP must be more than zero."),

    qty: z.string().min(1, "Pack size is required (e.g. “Pack of 72”)."),

    description: z.string().max(2000).default(""),
    about: z.string().max(2000).default(""),
    highlights: z.array(z.string().min(1)).max(8).default([]),
    countryOfOrigin: z.string().min(1).default("India"),

    images: z.array(z.string()).default([]),
    sizes: z.array(productSizeSchema).default([]),
    colors: z.array(productColorSchema).default([]),

    ages: z.array(z.enum(ageKeys)).default([]),
    type: z.string().min(1, "Give the product a type."),
    tags: z.array(z.string().min(1)).max(20).default([]),

    isBestseller: z.boolean().default(false),
    isTopDeal: z.boolean().default(false),
  })
  // MRP is the pre-discount price — below `price` it would render a negative
  // discount next to a struck-through number lower than what you pay.
  .refine((data) => data.mrp >= data.price, {
    message: "MRP must be at least the selling price.",
    path: ["mrp"],
  })
  // Selling below cost is nearly always a typo; block it where cost is known.
  .refine(
    (data) =>
      data.vendor?.costPrice == null || data.price >= data.vendor.costPrice,
    { message: "Selling price is below cost.", path: ["price"] },
  )
  // Duplicate size labels make the variant picker ambiguous.
  .refine(
    (data) =>
      new Set(data.sizes.map((size) => size.label.trim().toLowerCase()))
        .size === data.sizes.length,
    { message: "Size labels must be unique.", path: ["sizes"] },
  )
  // Same for colors.
  .refine(
    (data) =>
      new Set(data.colors.map((color) => color.label.trim().toLowerCase()))
        .size === data.colors.length,
    { message: "Color labels must be unique.", path: ["colors"] },
  );

export type ProductFormValues = z.input<typeof productFormSchema>;
export type ProductFormOutput = z.output<typeof productFormSchema>;

/** "Ultra-Soft Newborn Diapers" → "ultra-soft-newborn-diapers". */
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
