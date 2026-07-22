import { z } from "@hono/zod-openapi";

/**
 * Public-safe category shape — no internal ids. `brands` resolves to brand
 * *names* (see `categories.repo.ts`'s `findAll`/`findBySlug` in the admin
 * module, reused here), matching `docs/api/mumzo_api_plan.md` §3.
 */
export const publicCategorySchema = z
  .object({
    slug: z.string(),
    name: z.string(),
    tagline: z.string().nullable(),
    img: z.string().nullable(),
    color: z.string().nullable(),
    hasSizes: z.boolean(),
    brands: z.array(z.string()),
  })
  .openapi("PublicCategory");

export const categorySlugParamSchema = z.object({
  slug: z
    .string()
    .min(1)
    .openapi({ param: { name: "slug", in: "path" } }),
});
