import { z } from "@hono/zod-openapi";

export const hubSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    address: z.string(),
    lat: z.number().nullable(),
    lng: z.number().nullable(),
    isActive: z.boolean(),
    /** The hub order placement/stock checks resolve to until real
     * pincode-based routing exists — at most one hub carries this. */
    isDefault: z.boolean(),
  })
  .openapi("Hub");

export const createHubSchema = z.object({
  name: z.string().min(1).max(120),
  address: z.string().min(1).max(300),
  lat: z.number().min(-90).max(90).nullable().optional(),
  lng: z.number().min(-180).max(180).nullable().optional(),
  isActive: z.boolean().default(true),
  isDefault: z.boolean().optional(),
});

export const updateHubSchema = createHubSchema.partial();

export const hubIdParamSchema = z.object({
  id: z
    .string()
    .min(1)
    .openapi({ param: { name: "id", in: "path" } }),
});
