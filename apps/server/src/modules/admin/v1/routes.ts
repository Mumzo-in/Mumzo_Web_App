import type { Hono } from "hono";
import type { AppEnv } from "@/core";

import authRoutes from "./auth";
import brandsRoutes from "./brands/brands.module";
import categoriesRoutes from "./categories/categories.module";
import couponsRoutes from "./coupons/coupons.module";
import hubsRoutes from "./hubs/hubs.module";
import inventoryRoutes from "./inventory/inventory.module";
import productsRoutes from "./products/products.module";
import rolesRoutes from "./roles";
import staffRoutes from "./staff";
import uploadsRoutes from "./uploads/uploads.module";
import vendorsRoutes from "./vendors/vendors.module";

/**
 * Mount table for `/api/v1/admin/*`.
 *
 * Adding a domain is one entry here — `index.ts` only loops it, so it never
 * grows with the route count.
 */
export const adminRoutes: { path: string; router: Hono<AppEnv> }[] = [
  { path: "/auth", router: authRoutes },
  { path: "/roles", router: rolesRoutes },
  { path: "/staff", router: staffRoutes },
  { path: "/brands", router: brandsRoutes },
  { path: "/vendors", router: vendorsRoutes },
  { path: "/coupons", router: couponsRoutes },
  { path: "/categories", router: categoriesRoutes },
  { path: "/products", router: productsRoutes },
  { path: "/hubs", router: hubsRoutes },
  { path: "/inventory", router: inventoryRoutes },
  { path: "/uploads", router: uploadsRoutes },
];
