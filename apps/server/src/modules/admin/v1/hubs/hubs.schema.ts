import { z } from "@hono/zod-openapi";

export const hubTypeSchema = z.enum([
  "dark_store",
  "micro_warehouse",
  "fulfilment_center",
]);

export const hubSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    type: hubTypeSchema,
    address: z.string(),
    city: z.string().nullable(),
    state: z.string().nullable(),
    pincode: z.string().nullable(),
    lat: z.number().nullable(),
    lng: z.number().nullable(),
    contactName: z.string().nullable(),
    contactPhone: z.string().nullable(),
    capacity: z.number().nullable(),
    operatingHoursStart: z.string().nullable(),
    operatingHoursEnd: z.string().nullable(),
    avgPickPackMins: z.number(),
    serviceRadiusKm: z.number(),
    isActive: z.boolean(),
    /** The hub order placement/stock checks resolve to until real
     * pincode-based routing exists — at most one hub carries this. */
    isDefault: z.boolean(),
    createdAt: z.string(),
  })
  .openapi("Hub");

export const createHubSchema = z.object({
  name: z.string().min(1).max(120),
  type: hubTypeSchema.default("dark_store"),
  address: z.string().min(1).max(300),
  city: z.string().nullable().optional(),
  state: z.string().nullable().optional(),
  pincode: z.string().nullable().optional(),
  lat: z.number().min(-90).max(90).nullable().optional(),
  lng: z.number().min(-180).max(180).nullable().optional(),
  contactName: z.string().nullable().optional(),
  contactPhone: z.string().nullable().optional(),
  capacity: z.number().int().positive().nullable().optional(),
  operatingHoursStart: z.string().nullable().optional(),
  operatingHoursEnd: z.string().nullable().optional(),
  avgPickPackMins: z.number().int().positive().default(3),
  serviceRadiusKm: z.number().int().positive().default(5),
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
