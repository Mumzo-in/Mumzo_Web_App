import { z } from "@hono/zod-openapi";

const VENDOR_TYPES = [
  "manufacturer",
  "distributor",
  "retailer",
  "company",
  "other",
] as const;

const PAYMENT_TERMS = [
  "prepaid",
  "cod",
  "net_7",
  "net_15",
  "net_30",
  "net_60",
] as const;

export const vendorContactSchema = z.object({
  name: z.string().min(1).max(120),
  phone: z.string().max(20).nullable(),
  email: z.string().email().nullable(),
  isPrimary: z.boolean(),
});

export const vendorSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    slug: z.string(),
    type: z.enum(VENDOR_TYPES),
    contacts: z.array(vendorContactSchema),
    address: z.string().nullable(),
    city: z.string().nullable(),
    state: z.string().nullable(),
    pincode: z.string().nullable(),
    lat: z.number().nullable(),
    lng: z.number().nullable(),
    gstin: z.string().nullable(),
    pan: z.string().nullable(),
    paymentTerms: z.enum(PAYMENT_TERMS),
    defaultLeadTimeDays: z.number().int().nullable(),
    notes: z.string().nullable(),
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
  type: z.enum(VENDOR_TYPES).default("distributor"),
  contacts: z.array(vendorContactSchema).default([]),
  address: z.string().max(500).nullable().optional(),
  city: z.string().max(120).nullable().optional(),
  state: z.string().max(120).nullable().optional(),
  pincode: z.string().max(12).nullable().optional(),
  lat: z.number().nullable().optional(),
  lng: z.number().nullable().optional(),
  gstin: z.string().max(20).nullable().optional(),
  pan: z.string().max(20).nullable().optional(),
  paymentTerms: z.enum(PAYMENT_TERMS).default("net_30"),
  defaultLeadTimeDays: z.number().int().positive().nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
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

export const vendorProductSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    slug: z.string(),
    categorySlug: z.string(),
    price: z.number().int(),
    stock: z.number().int(),
    status: z.string(),
    costPrice: z.number().int().nullable(),
    leadTimeDays: z.number().int().nullable(),
    isPrimary: z.boolean(),
    vendorSku: z.string().nullable(),
    moq: z.number().int().nullable(),
  })
  .openapi("VendorProduct");

export const listVendorProductsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});
