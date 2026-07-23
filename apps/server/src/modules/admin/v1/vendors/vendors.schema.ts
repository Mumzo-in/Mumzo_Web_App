import { z } from "@hono/zod-openapi";

export const vendorSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    slug: z.string(),
    contactName: z.string().nullable(),
    phone: z.string().nullable(),
    email: z.string().nullable(),
    address: z.string().nullable(),
    gstin: z.string().nullable(),
    isActive: z.boolean(),
    productCount: z.number().int(),
  })
  .openapi("Vendor");

export const createVendorSchema = z.object({
  name: z.string().min(1).max(120),
  slug: z
    .string()
    .min(1)
    .max(120)
    .regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers and hyphens only."),
  contactName: z.string().max(120).nullable().optional(),
  phone: z.string().max(20).nullable().optional(),
  email: z.string().email().nullable().optional(),
  address: z.string().max(500).nullable().optional(),
  gstin: z.string().max(20).nullable().optional(),
  isActive: z.boolean().default(true),
});

export const updateVendorSchema = createVendorSchema.partial();

export const vendorIdParamSchema = z.object({
  id: z
    .string()
    .min(1)
    .openapi({ param: { name: "id", in: "path" } }),
});

export const listVendorsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().trim().min(1).optional(),
});
