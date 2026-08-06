import { z } from "@hono/zod-openapi";

export const brandSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    slug: z.string(),
    logoUrl: z.string().nullable(),
    isActive: z.boolean(),
    categorySlugs: z.array(z.string()),
    productCount: z.number().int(),
  })
  .openapi("Brand");

export const createBrandSchema = z.object({
  name: z.string().min(1).max(80),
  slug: z
    .string()
    .min(1)
    .max(80)
    .regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers and hyphens only."),
  logoUrl: z.string().url().nullable().optional(),
  isActive: z.boolean().default(true),
  /** Category slugs this brand is stocked under. */
  categorySlugs: z.array(z.string()).default([]),
  /**
   * Draft upload session carrying the logo (slot "logo"), if the admin
   * uploaded one via `POST /admin/uploads`. On save, the service copies
   * `mumzo/tmp/{sessionId}/logo.webp` to its final destination and sets
   * `logoUrl` to the resulting public URL.
   */
  uploadSessionId: z.uuid().optional(),
});

export const updateBrandSchema = createBrandSchema.partial();

export const listBrandsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z
    .string()
    .trim()
    .min(1)
    .optional()
    .openapi({ param: { name: "search", in: "query" } }),
});

export const brandIdParamSchema = z.object({
  id: z
    .string()
    .min(1)
    .openapi({ param: { name: "id", in: "path" } }),
});
