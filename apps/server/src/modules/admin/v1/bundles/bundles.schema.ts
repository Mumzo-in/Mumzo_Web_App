import { z } from "@hono/zod-openapi";

/**
 * Mirrors `@mumzo/schema`'s `Bundle`/`BundleItem`/`BundleStatus`. Kept as a
 * parallel zod schema (not imported from the model package) for the same
 * reason `products.schema.ts` does — this is the *wire* shape, with each
 * item's product fields resolved server-side, not the `productId` the write
 * side accepts.
 */

export const bundleItemSchema = z.object({
  productId: z.string(),
  productName: z.string(),
  productSlug: z.string(),
  productImage: z.string().nullable(),
  productPrice: z.number().int(),
  quantity: z.number().int().positive(),
});

export const bundleSchema = z
  .object({
    id: z.string(),
    slug: z.string(),
    name: z.string(),
    description: z.string().nullable(),
    price: z.number().int(),
    images: z.array(z.string()),
    status: z.enum(["draft", "active", "inactive", "archived"]),
    items: z.array(bundleItemSchema),
    itemCount: z.number().int(),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .openapi("Bundle");

const slugSchema = z
  .string()
  .min(2)
  .max(120)
  .regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers and hyphens only.");

const bundleItemInputSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().positive(),
});

/** What the bundle form owns — excludes `id`/`createdAt`/`updatedAt`; each
 * item is just `{ productId, quantity }`, the server resolves the rest. */
export const bundleWriteSchema = z
  .object({
    name: z.string().min(2).max(120),
    slug: slugSchema,
    description: z.string().max(2000).nullable().default(null),
    price: z.number().int().positive(),
    images: z.array(z.string()).default([]),
    status: z.enum(["draft", "active", "inactive", "archived"]),
    items: z.array(bundleItemInputSchema).default([]),
  })
  .refine((data) => data.items.length >= 2, {
    message: "A bundle needs at least 2 products.",
    path: ["items"],
  })
  .refine(
    (data) =>
      new Set(data.items.map((item) => item.productId)).size ===
      data.items.length,
    {
      message: "Each product can only appear once in a bundle.",
      path: ["items"],
    },
  );

export const createBundleSchema = bundleWriteSchema;
export const updateBundleSchema = bundleWriteSchema;

export const bundleIdParamSchema = z.object({
  id: z
    .string()
    .min(1)
    .openapi({ param: { name: "id", in: "path" } }),
});

export const listBundlesQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().trim().min(1).optional(),
  status: z.enum(["draft", "active", "inactive", "archived"]).optional(),
  productId: z.string().optional(),
});
