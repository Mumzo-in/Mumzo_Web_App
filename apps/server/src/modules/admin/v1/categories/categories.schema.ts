import { z } from "@hono/zod-openapi";

export const categorySchema = z
  .object({
    slug: z.string(),
    name: z.string(),
    tagline: z.string().nullable(),
    img: z.string().nullable(),
    color: z.string().nullable(),
    position: z.number().int(),
    isActive: z.boolean(),
    hasSizes: z.boolean(),
    brands: z.array(z.string()),
    productCount: z.number().int(),
  })
  .openapi("Category");

const slugSchema = z
  .string()
  .min(1)
  .max(60)
  .regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers and hyphens only.");

export const createCategorySchema = z.object({
  slug: slugSchema,
  name: z.string().min(1).max(80),
  tagline: z.string().max(160).nullable().optional(),
  img: z.string().url().nullable().optional(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Expected a hex color, e.g. #FCE1E6.")
    .nullable()
    .optional(),
  isActive: z.boolean().default(true),
  hasSizes: z.boolean().default(false),
  /** Brand ids stocked in this category. */
  brandIds: z.array(z.string()).default([]),
});

export const updateCategorySchema = createCategorySchema
  .omit({ slug: true })
  .partial();

export const reorderCategoriesSchema = z.object({
  /** Full ordered list of category slugs — the new position is the index. */
  slugs: z.array(z.string()).min(1),
});

export const categorySlugParamSchema = z.object({
  slug: z
    .string()
    .min(1)
    .openapi({ param: { name: "slug", in: "path" } }),
});
