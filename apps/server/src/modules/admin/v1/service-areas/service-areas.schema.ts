import { z } from "@hono/zod-openapi";

export const serviceAreaSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    pincode: z.string(),
    hubId: z.string(),
    hubName: z.string(),
    isActive: z.boolean(),
  })
  .openapi("ServiceArea");

const pincodeSchema = z.string().regex(/^\d{6}$/, "Pincode must be 6 digits.");

export const createServiceAreaSchema = z.object({
  name: z.string().min(1).max(120),
  pincode: pincodeSchema,
  hubId: z.string().min(1),
  isActive: z.boolean().default(true),
});

export const updateServiceAreaSchema = createServiceAreaSchema.partial();

export const serviceAreaIdParamSchema = z.object({
  id: z
    .string()
    .min(1)
    .openapi({ param: { name: "id", in: "path" } }),
});
