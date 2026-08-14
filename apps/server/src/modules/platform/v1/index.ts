import { createRoute, z } from "@hono/zod-openapi";

import {
  commonErrorResponses,
  createRouter,
  jsonContent,
  optionalAuth,
  successSchema,
} from "@/core";

import addressesRoutes from "./addresses/addresses.module";
import authRoutes from "./auth";
import brandsRoutes from "./brands/brands.module";
import cartRoutes from "./cart/cart.module";
import categoriesRoutes from "./categories/categories.module";
import couponsRoutes from "./coupons/coupons.module";
import devicesRoutes from "./devices/devices.module";
import locationRoutes from "./location/location.module";
import ogRoutes from "./og/og.module";
import ordersRoutes from "./orders/orders.module";
import productsRoutes, {
  productsByCategory as categoryProductsRoutes,
} from "./products/products.module";
import profileRoutes from "./profile/profile.module";
import referralsRoutes from "./referrals/referrals.module";
import reviewsRoutes from "./reviews/reviews.module";
import wishlistRoutes from "./wishlist/wishlist.module";

/**
 * Platform API v1 — the customer surface. Mounted at `/api/v1`.
 *
 * Add feature routers by chaining `.route()`, never by mutating the instance:
 *
 *   const v1 = createRouter()
 *     .use(optionalAuth)
 *     .route("/products", productRoutes)
 *     .route("/cart", cartRoutes);
 *
 * Chaining is what preserves the inferred type for `hc<AppType>()` on the
 * frontend. Reassigning or mutating loses it.
 */

const pingRoute = createRoute({
  method: "get",
  path: "/ping",
  tags: ["Platform | Catalog"],
  summary: "Connectivity check",
  responses: {
    200: jsonContent(
      successSchema(
        z.object({
          pong: z.literal(true),
          surface: z.literal("platform"),
          version: z.literal("v1"),
        }),
      ),
      "Reachable",
    ),
    ...commonErrorResponses,
  },
});

const app = createRouter();

// Registered separately, not chained: `.use()` on OpenAPIHono returns a plain
// Hono, which drops the `.openapi()` method from the type.
//
// `optionalAuth` never rejects, so unlike the admin side it can run over
// `/auth/*` harmlessly.
app.use(optionalAuth);

app.route("/addresses", addressesRoutes);
app.route("/auth", authRoutes);
app.route("/cart", cartRoutes);
app.route("/categories", categoriesRoutes);
app.route("/categories", categoryProductsRoutes);
app.route("/brands", brandsRoutes);
app.route("/products", productsRoutes);
app.route("/coupons", couponsRoutes);
app.route("/devices", devicesRoutes);
app.route("/location", locationRoutes);
app.route("/orders", ordersRoutes);
app.route("/profile", profileRoutes);
app.route("/referrals", referralsRoutes);
app.route("/reviews", reviewsRoutes);
app.route("/wishlist", wishlistRoutes);
app.route("/og", ogRoutes);

const v1 = app.openapi(pingRoute, (c) =>
  c.json(
    {
      success: true as const,
      data: {
        pong: true as const,
        surface: "platform" as const,
        version: "v1" as const,
      },
    },
    200,
  ),
);

export default v1;
