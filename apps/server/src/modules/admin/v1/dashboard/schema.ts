import { z } from "@hono/zod-openapi";

export const userCountsSchema = z.object({
  totalUsers: z.number().int(),
  newUsers: z.number().int(),
  newUsersChangePct: z.number(),
});

export type UserCounts = z.infer<typeof userCountsSchema>;

export const recentUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  phoneNumber: z.string().nullable(),
  babyName: z.string().nullable(),
  babyAge: z.string().nullable(),
  joinedAt: z.string(),
  orderCount: z.number().int(),
});

export type RecentUser = z.infer<typeof recentUserSchema>;
