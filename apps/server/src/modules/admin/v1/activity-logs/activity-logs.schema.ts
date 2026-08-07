import { z } from "@hono/zod-openapi";

export const activityLogSchema = z
  .object({
    id: z.string(),
    staffUserId: z.string(),
    staffUserName: z.string().nullable(),
    action: z.string(),
    entityType: z.string(),
    entityId: z.string().nullable(),
    description: z.string(),
    previousValues: z.any().nullable(),
    newValues: z.any().nullable(),
    ipAddress: z.string().nullable(),
    userAgent: z.string().nullable(),
    createdAt: z.string(),
  })
  .openapi("ActivityLog");

export const listActivityLogsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  staffUserId: z.string().optional(),
  entityType: z.string().optional(),
  action: z.string().optional(),
  search: z.string().trim().min(1).optional(),
});
