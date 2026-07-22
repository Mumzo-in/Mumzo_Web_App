import { z } from "@hono/zod-openapi";

/**
 * Public-safe brand shape — no internal `id` (the admin-only primary key).
 * `slug` is the real, unique DB column (`packages/db/src/schema/catalog.ts`),
 * not the storefront's derived `brandSlug()` helper.
 */
export const publicBrandSchema = z
  .object({
    slug: z.string(),
    name: z.string(),
    logoUrl: z.string().nullable(),
    productCount: z.number().int(),
  })
  .openapi("PublicBrand");

export const brandSlugParamSchema = z.object({
  slug: z
    .string()
    .min(1)
    .openapi({ param: { name: "slug", in: "path" } }),
});
