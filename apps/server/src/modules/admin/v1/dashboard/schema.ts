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

export const orderMetricsSchema = z.object({
  gmv: z.number().int(),
  gmvChangePct: z.number(),
  orders: z.number().int(),
  ordersChangePct: z.number(),
  aov: z.number().int(),
  aovChangePct: z.number(),
});

export type OrderMetrics = z.infer<typeof orderMetricsSchema>;

export const revenueTrendPointSchema = z.object({
  date: z.string(),
  revenue: z.number().int(),
  orders: z.number().int(),
});

export type RevenueTrendPoint = z.infer<typeof revenueTrendPointSchema>;

export const recentOrderSchema = z.object({
  id: z.string(),
  customerName: z.string(),
  itemCount: z.number().int(),
  total: z.number().int(),
  status: z.string(),
  placedAt: z.string(),
});

export type RecentOrder = z.infer<typeof recentOrderSchema>;

export const orderDashboardSchema = z.object({
  metrics: orderMetricsSchema,
  revenueTrend: z.array(revenueTrendPointSchema),
  recentOrders: z.array(recentOrderSchema),
});

export type OrderDashboard = z.infer<typeof orderDashboardSchema>;

export const analyticsRangeQuerySchema = z.object({
  from: z.string(),
  to: z.string(),
});

export const orderStatusPointSchema = z.object({
  status: z.string(),
  count: z.number().int(),
});

export const hubRevenuePointSchema = z.object({
  hubId: z.string(),
  hubName: z.string(),
  revenue: z.number().int(),
  orders: z.number().int(),
});

export const paymentMethodPointSchema = z.object({
  method: z.string(),
  count: z.number().int(),
});

export const orderAnalyticsSchema = z.object({
  totalRevenue: z.number().int(),
  totalOrders: z.number().int(),
  aov: z.number().int(),
  revenueTrend: z.array(revenueTrendPointSchema),
  orderStatus: z.array(orderStatusPointSchema),
  hubRevenue: z.array(hubRevenuePointSchema),
  paymentMethod: z.array(paymentMethodPointSchema),
});

export type OrderAnalytics = z.infer<typeof orderAnalyticsSchema>;
