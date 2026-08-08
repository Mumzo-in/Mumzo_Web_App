import type { Hono } from "hono";
import type { AppEnv } from "@/core";
import activityLogsRoutes from "./activity-logs/activity-logs.module";
import authRoutes from "./auth";
import brandsRoutes from "./brands/brands.module";
import bundlesRoutes from "./bundles/bundles.module";
import categoriesRoutes from "./categories/categories.module";
import couponsRoutes from "./coupons/coupons.module";
import customerEventsRoutes from "./customer-events/customer-events.module";
import dashboardRoutes from "./dashboard";
import devicesRoutes from "./devices/devices.module";
import hubsRoutes from "./hubs/hubs.module";
import inventoryRoutes from "./inventory/inventory.module";
import ordersRoutes from "./orders/orders.module";
import productsRoutes from "./products/products.module";
import referralsRoutes from "./referrals/referrals.module";
import refundsRoutes from "./refunds/refunds.module";
import rolesRoutes from "./roles";
import serviceAreasRoutes from "./service-areas/service-areas.module";
import staffRoutes from "./staff";
import uploadsRoutes from "./uploads/uploads.module";
import usersRoutes from "./users/users.module";
import vendorsRoutes from "./vendors/vendors.module";
import wsRoutes from "./ws/ws.module";

/**
 * Mount table for `/api/v1/admin/*`.
 *
 * Adding a domain is one entry here — `index.ts` only loops it, so it never
 * grows with the route count.
 */
export const adminRoutes: { path: string; router: Hono<AppEnv> }[] = [
  { path: "/auth", router: authRoutes },
  { path: "/dashboard", router: dashboardRoutes },
  { path: "/devices", router: devicesRoutes },
  { path: "/roles", router: rolesRoutes },
  { path: "/staff", router: staffRoutes },
  { path: "/brands", router: brandsRoutes },
  { path: "/vendors", router: vendorsRoutes },
  { path: "/bundles", router: bundlesRoutes },
  { path: "/coupons", router: couponsRoutes },
  { path: "/categories", router: categoriesRoutes },
  { path: "/products", router: productsRoutes },
  { path: "/orders", router: ordersRoutes },
  { path: "/referrals", router: referralsRoutes },
  { path: "/hubs", router: hubsRoutes },
  { path: "/refunds", router: refundsRoutes },
  { path: "/service-areas", router: serviceAreasRoutes },
  { path: "/inventory", router: inventoryRoutes },
  { path: "/uploads", router: uploadsRoutes },
  { path: "/users", router: usersRoutes },
  { path: "/ws", router: wsRoutes },
  { path: "/activity-logs", router: activityLogsRoutes },
  { path: "/customer-events", router: customerEventsRoutes },
];
