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

export const productSchema = z
  .object({
    id: z.string(),
    slug: z.string(),
    sku: z.string(),
    name: z.string(),
    brand: z.string(),
    brandId: z.string(),
    vendor: z.string().nullable(),
    vendorId: z.string().nullable(),
    categorySlug: z.string(),

    price: z.number().int(),
    mrp: z.number().int(),
    costPrice: z.number().int().nullable(),

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
    status: z.enum(["draft", "active", "archived"]),
    updatedAt: z.string(),
  })
  .openapi("Product");

const slugSchema = z
  .string()
  .min(2)
  .max(120)
  .regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers and hyphens only.");

/**
 * What the form owns — excludes `id`/`stock`/`rating`/`updatedAt`, matching
 * `ProductInput` in the admin's mock API (`stock` rolls up from sizes or its
 * own endpoint, `rating` is derived from reviews, the rest are server-owned).
 */
export const productWriteSchema = z
  .object({
    name: z.string().min(2).max(120),
    slug: slugSchema,
    sku: z.string().min(2).max(40),
    brandId: z.string().min(1),
    vendorId: z.string().nullable().default(null),
    categorySlug: z.string().min(1),
    status: z.enum(["draft", "active", "archived"]),

    price: z.number().int().positive(),
    mrp: z.number().int().positive(),
    costPrice: z.number().int().positive().nullable(),

    qty: z.string().min(1),
    weight: z.string().nullable(),

    description: z.string().max(2000).default(""),
    about: z.string().max(2000).default(""),
    highlights: z.array(z.string().min(1)).max(8).default([]),
    countryOfOrigin: z.string().min(1).default("India"),

    images: z.array(z.string()).default([]),
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
  .refine((data) => data.costPrice === null || data.price >= data.costPrice, {
    message: "Selling price is below cost.",
    path: ["price"],
  })
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
  status: z.enum(["draft", "active", "archived"]).optional(),
  categorySlug: z.string().optional(),
  vendorId: z.string().optional(),
});
