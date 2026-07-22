import { createRoute } from "@hono/zod-openapi";

import {
  commonErrorResponses,
  jsonContent,
  paginatedSchema,
  successSchema,
} from "@/core";
import {
  categorySlugParamSchema,
  listProductsQuerySchema,
  productIdParamSchema,
  publicProductSchema,
} from "./products.schema";

const TAG = "Platform | Catalog";

export const listRoute = createRoute({
  method: "get",
  path: "/",
  tags: [TAG],
  summary: "List active products",
  request: { query: listProductsQuerySchema },
  responses: {
    200: jsonContent(paginatedSchema(publicProductSchema), "Page of products"),
    ...commonErrorResponses,
  },
});

export const getRoute = createRoute({
  method: "get",
  path: "/{id}",
  tags: [TAG],
  summary: "Get an active product by id",
  request: { params: productIdParamSchema },
  responses: {
    200: jsonContent(successSchema(publicProductSchema), "The product"),
    ...commonErrorResponses,
  },
});

/**
 * Mounted under `/categories` (not `/products`) in `platform/v1/index.ts` so
 * the final path is `GET /api/v1/categories/{slug}/products`, per
 * `docs/api/mumzo_api_plan.md` §4.
 */
export const listByCategoryRoute = createRoute({
  method: "get",
  path: "/{slug}/products",
  tags: [TAG],
  summary: "List active products in a category",
  request: {
    params: categorySlugParamSchema,
    query: listProductsQuerySchema,
  },
  responses: {
    200: jsonContent(paginatedSchema(publicProductSchema), "Page of products"),
    ...commonErrorResponses,
  },
});
