import { z } from "@hono/zod-openapi";

export const hubSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    address: z.string(),
    isActive: z.boolean(),
    /** The hub order placement/stock checks resolve to until real
     * pincode-based routing exists — at most one hub carries this. */
    isDefault: z.boolean(),
  })
  .openapi("Hub");

export const createHubSchema = z.object({
  name: z.string().min(1).max(120),
  address: z.string().min(1).max(300),
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
