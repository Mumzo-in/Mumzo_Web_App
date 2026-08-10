import { z } from "@hono/zod-openapi";

/**
 * Public-safe product shape — no internal ids (`brandId`/`categoryId`/
 * `vendorId`) and no `costPrice` (margin, never exposed to shoppers), unlike
 * the admin's `productSchema` (`admin/v1/products/products.schema.ts`).
 * `brand` resolves to the display name via a join, `categorySlug` to the
 * real DB slug — same resolution the admin schema does.
 */
export const publicProductSizeSchema = z.object({
  id: z.string(),
  label: z.string(),
  price: z.number().int(),
  stock: z.number().int(),
});

/** Same shape as `publicProductSizeSchema` — color/style, a separate axis. */
export const publicProductColorSchema = z.object({
  id: z.string(),
  label: z.string(),
  price: z.number().int(),
  stock: z.number().int(),
});

export const publicProductSchema = z
  .object({
    id: z.string(),
    slug: z.string(),
    name: z.string(),
    brand: z.string(),
    brandSlug: z.string(),
    categorySlug: z.string(),

    price: z.number().int(),
    mrp: z.number().int(),

    qty: z.string(),

    description: z.string(),
    about: z.string(),
    highlights: z.array(z.string()),
    countryOfOrigin: z.string(),

    images: z.array(z.string()),
    sizes: z.array(publicProductSizeSchema),
    colors: z.array(publicProductColorSchema),

    ages: z.array(z.string()),
    type: z.string(),
    tags: z.array(z.string()),

    stock: z.number().int(),
    rating: z.number(),

    isBestseller: z.boolean(),
    isTopDeal: z.boolean(),
    updatedAt: z.string(),
  })
  .openapi("PublicProduct");

export const productIdParamSchema = z.object({
  id: z
    .string()
    .min(1)
    .openapi({ param: { name: "id", in: "path" } }),
});

export const categorySlugParamSchema = z.object({
  slug: z
    .string()
    .min(1)
    .openapi({ param: { name: "slug", in: "path" } }),
});

/**
 * Query params per `docs/api/mumzo_api_plan.md` §4. `page`/`limit`/
 * `categorySlug`/`sort` are fully implemented. `brands` filters by
 * comma-separated brand *slugs* (consistent with the public brands API,
 * which addresses brands by slug — see `platform/v1/brands/brands.schema.ts`).
 * `sizes`/`inStock` are implemented as straightforward row/variant filters.
 */
export const listProductsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().trim().min(1).optional(),
  categorySlug: z.string().optional(),
  sort: z
    .enum(["relevance", "price_asc", "price_desc", "discount", "rating"])
    .default("relevance"),
  brands: z
    .string()
    .optional()
    .transform((value) =>
      value
        ? value
            .split(",")
            .map((slug) => slug.trim())
            .filter(Boolean)
        : undefined,
    ),
  minPrice: z.coerce.number().int().nonnegative().optional(),
  maxPrice: z.coerce.number().int().nonnegative().optional(),
  sizes: z
    .string()
    .optional()
    .transform((value) =>
      value
        ? value
            .split(",")
            .map((label) => label.trim())
            .filter(Boolean)
        : undefined,
    ),
  inStock: z
    .enum(["true", "false"])
    .optional()
    .transform((value) => (value === undefined ? undefined : value === "true")),
  bestseller: z
    .enum(["true", "false"])
    .optional()
    .transform((value) => (value === undefined ? undefined : value === "true")),
  /** Admin-curated "Top deals" flag (`product.isTopDeal`) — same pattern as
   * `bestseller`. Combine with `sort=discount` to rank the pinned set by
   * discount size. */
  topDeal: z
    .enum(["true", "false"])
    .optional()
    .transform((value) => (value === undefined ? undefined : value === "true")),
});
