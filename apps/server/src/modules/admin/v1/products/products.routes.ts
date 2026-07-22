import { createRoute, z } from "@hono/zod-openapi";

import {
  authErrorResponses,
  jsonContent,
  paginatedSchema,
  successSchema,
} from "@/core";
import {
  createProductSchema,
  listProductsQuerySchema,
  productIdParamSchema,
  productSchema,
  updateProductSchema,
} from "./products.schema";

const TAG = "Admin | Catalog";

export const listRoute = createRoute({
  method: "get",
  path: "/",
  tags: [TAG],
  summary: "List products",
  security: [{ cookieAuth: [] }],
  request: { query: listProductsQuerySchema },
  responses: {
    200: jsonContent(paginatedSchema(productSchema), "Page of products"),
    ...authErrorResponses,
  },
});

export const getRoute = createRoute({
  method: "get",
  path: "/{id}",
  tags: [TAG],
  summary: "Get a product",
  security: [{ cookieAuth: [] }],
  request: { params: productIdParamSchema },
  responses: {
    200: jsonContent(successSchema(productSchema), "The product"),
    ...authErrorResponses,
  },
});

export const createRouteDef = createRoute({
  method: "post",
  path: "/",
  tags: [TAG],
  summary: "Create a product",
  security: [{ cookieAuth: [] }],
  request: {
    body: { content: { "application/json": { schema: createProductSchema } } },
  },
  responses: {
    201: jsonContent(successSchema(z.object({ id: z.string() })), "Created"),
    ...authErrorResponses,
  },
});

export const updateRouteDef = createRoute({
  method: "put",
  path: "/{id}",
  tags: [TAG],
  summary: "Replace a product",
  security: [{ cookieAuth: [] }],
  request: {
    params: productIdParamSchema,
    body: { content: { "application/json": { schema: updateProductSchema } } },
  },
  responses: {
    200: jsonContent(
      successSchema(z.object({ ok: z.literal(true) })),
      "Updated",
    ),
    ...authErrorResponses,
  },
});

export const deleteRouteDef = createRoute({
  method: "delete",
  path: "/{id}",
  tags: [TAG],
  summary: "Delete a product",
  security: [{ cookieAuth: [] }],
  request: { params: productIdParamSchema },
  responses: {
    200: jsonContent(
      successSchema(z.object({ ok: z.literal(true) })),
      "Deleted",
    ),
    ...authErrorResponses,
  },
});
