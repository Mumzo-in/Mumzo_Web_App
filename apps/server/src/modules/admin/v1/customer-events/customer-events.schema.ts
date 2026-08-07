import { z } from "@hono/zod-openapi";

export const adminCustomerEventSchema = z
  .object({
    id: z.string(),
    userId: z.string(),
    userName: z.string().nullable(),
    userEmail: z.string().nullable(),
    action: z.string(),
    entityType: z.string(),
    entityId: z.string().nullable(),
    metadata: z.unknown().nullable(),
    createdAt: z.string(),
  })
  .openapi("AdminCustomerEvent");

export const listCustomerEventsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  userId: z.string().optional(),
  action: z.string().optional(),
  search: z.string().trim().min(1).optional(),
});
