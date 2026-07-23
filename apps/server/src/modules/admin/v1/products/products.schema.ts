import { z } from "@hono/zod-openapi";

/**
 * Mirrors `@mumzo/schema`'s `Product`/`ProductSize`/`AgeGroup`/
 * `ProductStatus`. Kept as a parallel zod schema (not imported from the
 * model package) because these are the *wire* shapes — `brand`/`categorySlug`
 * are resolved strings here, not the `brandId`/`categoryId` the DB stores.
 */

export const productSizeSchema = z.object({
  label: z.string().min(1),
  price: z.number().int().positive(),
  stock: z.number().int().min(0),
});

/** Sourcing info, wire shape — `null` for a self-stocked product. */
export const productVendorSchema = z
  .object({
    vendorId: z.string(),
    vendorName: z.string(),
    relationship: z.enum(["own", "retainer", "distributor"]),
    costPrice: z.number().int().nullable(),
    leadTimeDays: z.number().int().nullable(),
    notes: z.string().nullable(),
  })
  .nullable();

export const productSchema = z
  .object({
    id: z.string(),
    slug: z.string(),
    sku: z.string(),
    name: z.string(),
    brand: z.string(),
    brandId: z.string(),
    vendor: productVendorSchema,
    categorySlug: z.string(),

    price: z.number().int(),
    mrp: z.number().int(),

    qty: z.string(),
    weight: z.string().nullable(),

    description: z.string(),
    about: z.string(),
    highlights: z.array(z.string()),
    countryOfOrigin: z.string(),

    images: z.array(z.string()),
    sizes: z.array(productSizeSchema),

    ages: z.array(z.string()),
    type: z.string(),
    tags: z.array(z.string()),

    stock: z.number().int(),
    rating: z.number(),

    isBestseller: z.boolean(),
    status: z.enum(["draft", "active", "inactive", "archived"]),
    updatedAt: z.string(),
  })
  .openapi("Product");

const slugSchema = z
  .string()
  .min(2)
  .max(120)
  .regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers and hyphens only.");

/** Sourcing input the Sourcing tab submits — `null` for self-stocked. */
export const productVendorInputSchema = z
  .object({
    vendorId: z.string().min(1),
    relationship: z.enum(["own", "retainer", "distributor"]),
    costPrice: z.number().int().positive().nullable().default(null),
    leadTimeDays: z.number().int().min(0).nullable().default(null),
    notes: z.string().max(2000).nullable().default(null),
  })
  .nullable();

/**
 * What the form owns — excludes `id`/`stock`/`rating`/`updatedAt`, matching
 * `ProductInput` in the admin's mock API (`stock` rolls up from sizes or its
 * own endpoint, `rating` is derived from reviews, the rest are server-owned).
 * `uploadSessionId` is optional and write-only — when present, the service
 * moves that session's draft images to their final product-scoped keys
 * before persisting `images`.
 */
export const productWriteSchema = z
  .object({
    name: z.string().min(2).max(120),
    slug: slugSchema,
    sku: z.string().min(2).max(40),
    brandId: z.string().min(1),
    vendor: productVendorInputSchema.default(null),
    categorySlug: z.string().min(1),
    status: z.enum(["draft", "active", "inactive", "archived"]),

    price: z.number().int().positive(),
    mrp: z.number().int().positive(),

    qty: z.string().min(1),
    weight: z.string().nullable(),

    description: z.string().max(2000).default(""),
    about: z.string().max(2000).default(""),
    highlights: z.array(z.string().min(1)).max(8).default([]),
    countryOfOrigin: z.string().min(1).default("India"),

    images: z.array(z.string()).default([]),
    /** Draft image-upload session to finalize on save. Omit when `images`
     * already holds final URLs (no pending uploads this submit). */
    uploadSessionId: z.string().nullable().default(null),
    sizes: z.array(productSizeSchema).default([]),

    ages: z.array(z.string()).default([]),
    type: z.string().min(1),
    tags: z.array(z.string().min(1)).max(20).default([]),

    isBestseller: z.boolean().default(false),
  })
  .refine((data) => data.mrp >= data.price, {
    message: "MRP must be at least the selling price.",
    path: ["mrp"],
  })
  .refine(
    (data) =>
      data.vendor?.costPrice == null || data.price >= data.vendor.costPrice,
    { message: "Selling price is below cost.", path: ["price"] },
  )
  .refine(
    (data) =>
      new Set(data.sizes.map((size) => size.label.trim().toLowerCase()))
        .size === data.sizes.length,
    { message: "Size labels must be unique.", path: ["sizes"] },
  );

export const createProductSchema = productWriteSchema;
export const updateProductSchema = productWriteSchema;

export const productIdParamSchema = z.object({
  id: z
    .string()
    .min(1)
    .openapi({ param: { name: "id", in: "path" } }),
});

export const listProductsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().trim().min(1).optional(),
  status: z.enum(["draft", "active", "inactive", "archived"]).optional(),
  categorySlug: z.string().optional(),
  vendorId: z.string().optional(),
});
