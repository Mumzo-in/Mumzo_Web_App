import { z } from "@hono/zod-openapi";

/**
 * Mirrors `@mumzo/schema`'s `Product`/`ProductSize`/`AgeGroup`/
 * `ProductStatus`. Kept as a parallel zod schema (not imported from the
 * model package) because these are the *wire* shapes — `brand`/`categorySlug`
 * are resolved strings here, not the `brandId`/`categoryId` the DB stores.
 */

/** `id` is present on read (identifies the `productSize` row for the cart to
 * reference) and absent on write — the form always fully replaces a
 * product's sizes/colors on save, so there's never an existing id to send.
 * `stock` is read-only here too — it's a live rollup of per-hub `inventory`,
 * never a column the write path accepts (see `productSizeWriteSchema`). */
export const productSizeSchema = z
  .object({
    id: z.string().optional(),
    label: z.string().min(1),
    sku: z.string().min(1),
    price: z.number().int().positive(),
    mrp: z.number().int().positive(),
    costPrice: z.number().int().positive().nullable().default(null),
    stock: z.number().int().min(0),
    weightGrams: z.number().int().min(0).default(0),
    /** Pack size shown on the product page — "Pack of 72", "500 ml". */
    qty: z.string().min(1),
  })
  .refine((data) => data.mrp >= data.price, {
    message: "MRP must be at least the selling price.",
    path: ["mrp"],
  });

/** Same shape as `productSizeSchema` — color/style, a separate axis. */
export const productColorSchema = z
  .object({
    id: z.string().optional(),
    label: z.string().min(1),
    sku: z.string().min(1),
    price: z.number().int().positive(),
    mrp: z.number().int().positive(),
    costPrice: z.number().int().positive().nullable().default(null),
    stock: z.number().int().min(0),
    weightGrams: z.number().int().min(0).default(0),
    /** Pack size shown on the product page — "Pack of 72", "500 ml". */
    qty: z.string().min(1),
  })
  .refine((data) => data.mrp >= data.price, {
    message: "MRP must be at least the selling price.",
    path: ["mrp"],
  });

/** What create/update actually accept per variant — no `stock`. Stock lives
 * only in per-hub `inventory`, set via the inventory endpoints, never
 * through the product form. */
export const productSizeWriteSchema = z
  .object({
    id: z.string().optional(),
    label: z.string().min(1),
    sku: z.string().min(1),
    price: z.number().int().positive(),
    mrp: z.number().int().positive(),
    costPrice: z.number().int().positive().nullable().default(null),
    weightGrams: z.number().int().min(0).default(0),
    qty: z.string().min(1),
  })
  .refine((data) => data.mrp >= data.price, {
    message: "MRP must be at least the selling price.",
    path: ["mrp"],
  });

/** Same shape as `productSizeWriteSchema` — color/style, a separate axis. */
export const productColorWriteSchema = z
  .object({
    id: z.string().optional(),
    label: z.string().min(1),
    sku: z.string().min(1),
    price: z.number().int().positive(),
    mrp: z.number().int().positive(),
    costPrice: z.number().int().positive().nullable().default(null),
    weightGrams: z.number().int().min(0).default(0),
    qty: z.string().min(1),
  })
  .refine((data) => data.mrp >= data.price, {
    message: "MRP must be at least the selling price.",
    path: ["mrp"],
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
    name: z.string(),
    brand: z.string(),
    brandId: z.string(),
    vendor: productVendorSchema,
    categorySlug: z.string(),

    /** Rolled up from the primary (first) variant server-side. */
    price: z.number().int(),
    mrp: z.number().int(),

    unitType: z.enum(["pack", "weight", "volume", "size", "piece"]).nullable(),
    qty: z.string(),

    description: z.string(),
    about: z.string(),
    highlights: z.array(z.string()),
    countryOfOrigin: z.string(),

    images: z.array(z.string()),
    sizes: z.array(productSizeSchema),
    colors: z.array(productColorSchema),

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
 * `sku`/`price`/`mrp`/`qty` are **not** here — they're per-variant now
 * (`sizes[]`), and the product row's own `sku`/`price`/`mrp`/`qty` are
 * derived server-side from the primary (first) variant so the
 * cart/checkout/storefront pricing fallback, which still reads those
 * columns directly, keeps working.
 * `slug` also isn't here — the service generates it from `name` on create
 * (slugified name plus a random suffix, Amazon-style) and leaves it
 * unchanged on update, so it's never client-writable.
 * `uploadSessionId` is optional and write-only — when present, the service
 * moves that session's draft images to their final product-scoped keys
 * before persisting `images`.
 */
export const productWriteSchema = z
  .object({
    name: z.string().min(2).max(120),
    brandId: z.string().min(1),
    vendor: productVendorInputSchema.default(null),
    categorySlug: z.string().min(1),
    status: z.enum(["draft", "active", "inactive", "archived"]),

    unitType: z
      .enum(["pack", "weight", "volume", "size", "piece"])
      .nullable()
      .default(null),

    description: z.string().max(2000).default(""),
    about: z.string().max(2000).default(""),
    highlights: z.array(z.string().min(1)).max(8).default([]),
    countryOfOrigin: z.string().min(1).default("India"),

    images: z.array(z.string()).default([]),
    /** Draft image-upload session to finalize on save. Omit when `images`
     * already holds final URLs (no pending uploads this submit). */
    uploadSessionId: z.string().nullable().default(null),
    sizes: z.array(productSizeWriteSchema).min(1),
    colors: z.array(productColorWriteSchema).default([]),

    ages: z.array(z.string()).default([]),
    type: z.string().min(1),
    tags: z.array(z.string().min(1)).max(20).default([]),

    isBestseller: z.boolean().default(false),
  })
  .refine(
    (data) => {
      const primary = data.sizes[0];
      return (
        primary === undefined ||
        primary.costPrice == null ||
        primary.price >= primary.costPrice
      );
    },
    { message: "Selling price is below cost.", path: ["sizes", 0, "price"] },
  )
  .refine(
    (data) =>
      new Set(data.sizes.map((size) => size.sku.trim().toLowerCase())).size ===
      data.sizes.length,
    { message: "SKUs must be unique.", path: ["sizes"] },
  )
  .refine(
    (data) =>
      new Set(data.sizes.map((size) => size.label.trim().toLowerCase()))
        .size === data.sizes.length,
    { message: "Size labels must be unique.", path: ["sizes"] },
  )
  .refine(
    (data) =>
      new Set(data.colors.map((color) => color.label.trim().toLowerCase()))
        .size === data.colors.length,
    { message: "Color labels must be unique.", path: ["colors"] },
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
  stock: z.enum(["low"]).optional(),
});
