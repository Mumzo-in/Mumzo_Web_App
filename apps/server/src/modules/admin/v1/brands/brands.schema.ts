import { z } from "@hono/zod-openapi";

export const brandSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    slug: z.string(),
    logoUrl: z.string().nullable(),
    isActive: z.boolean(),
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
  /**
   * Draft upload session carrying the logo (slot "logo"), if the admin
   * uploaded one via `POST /admin/uploads`. On save, the service copies
   * `mumzo/tmp/{sessionId}/logo.webp` to its final destination and sets
   * `logoUrl` to the resulting public URL.
   */
  uploadSessionId: z.uuid().optional(),
});

export const updateBrandSchema = createBrandSchema.partial();

export const brandIdParamSchema = z.object({
  id: z
    .string()
    .min(1)
    .openapi({ param: { name: "id", in: "path" } }),
});
