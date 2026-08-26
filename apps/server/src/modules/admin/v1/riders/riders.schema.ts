import { z } from "@hono/zod-openapi";

export const riderIdParamSchema = z.object({ id: z.string().uuid() });

export const listRidersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  search: z.string().optional(),
  status: z.string().optional(),
});

export const riderSchema = z.object({
  id: z.string(),
  name: z.string(),
  phone: z.string(),
  email: z.string().nullable(),
  status: z.string(),
  hubId: z.string().nullable(),
  hubName: z.string().nullable(),
  vehicleType: z.string().nullable(),
  vehicleNumber: z.string().nullable(),
  licenseNumber: z.string().nullable().optional(),
  /** Auto-generated on create; shown to ops so they can pass it to the rider. */
  accessCode: z.string().nullable(),
  kycVerified: z.boolean(),
  totalDeliveries: z.number(),
  createdAt: z.string(),
});

export const createRiderSchema = z.object({
  name: z.string().min(1).max(120),
  phone: z.string().min(6).max(20),
  email: z.string().email().nullable().optional(),
  hubId: z.string().uuid().nullable().optional(),
  status: z.enum(["active", "inactive", "on_delivery", "offline"]).optional(),
  vehicleType: z.string().max(40).nullable().optional(),
  vehicleNumber: z.string().max(40).nullable().optional(),
  licenseNumber: z.string().max(60).nullable().optional(),
  kycVerified: z.boolean().optional(),
});

export const updateRiderSchema = createRiderSchema.partial();

export const deleteRiderSchema = z.object({
  deleted: z.boolean(),
  deactivated: z.boolean(),
});
