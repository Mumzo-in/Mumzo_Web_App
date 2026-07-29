import { z } from "@hono/zod-openapi";

export const addressIdParamSchema = z.object({
  id: z.uuid().openapi({ param: { name: "id", in: "path" } }),
});

const PINCODE_RE = /^\d{6}$/;

const addressFieldsSchema = {
  label: z.enum(["Home", "Work", "Other"]),
  name: z.string().trim().min(1, "Name is required").max(120),
  phone: z.string().trim().min(1, "Phone is required").max(20),
  line1: z.string().trim().min(1, "Address line is required").max(200),
  line2: z.string().trim().min(1, "Area/street is required").max(200),
  landmark: z.string().trim().max(200).optional(),
  pincode: z.string().trim().regex(PINCODE_RE, "Pincode must be 6 digits"),
  city: z.string().trim().min(1, "City is required").max(100),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  isDefault: z.boolean().default(false),
};

export const createAddressSchema = z
  .object(addressFieldsSchema)
  .openapi("CreateAddressInput");

export const updateAddressSchema = z
  .object(addressFieldsSchema)
  .openapi("UpdateAddressInput");

export const addressSchema = z
  .object({
    id: z.string(),
    label: z.enum(["Home", "Work", "Other"]),
    name: z.string(),
    phone: z.string(),
    line1: z.string(),
    line2: z.string(),
    landmark: z.string().nullable(),
    pincode: z.string(),
    city: z.string(),
    lat: z.number().nullable(),
    lng: z.number().nullable(),
    isDefault: z.boolean(),
  })
  .openapi("Address");
