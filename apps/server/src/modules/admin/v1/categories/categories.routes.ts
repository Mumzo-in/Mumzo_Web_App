import { createRoute, z } from "@hono/zod-openapi";

import { authErrorResponses, jsonContent, successSchema } from "@/core";
import {
  categorySchema,
  categorySlugParamSchema,
  createCategorySchema,
  reorderCategoriesSchema,
  updateCategorySchema,
} from "./categories.schema";

const TAG = "Admin | Catalog";

export const listRoute = createRoute({
  method: "get",
  path: "/",
  tags: [TAG],
  summary: "List categories, ordered by merchandising position",
  security: [{ cookieAuth: [] }],
  responses: {
    200: jsonContent(successSchema(z.array(categorySchema)), "All categories"),
    ...authErrorResponses,
  },
});

export const getRoute = createRoute({
  method: "get",
  path: "/{slug}",
  tags: [TAG],
  summary: "Get a category by slug",
  security: [{ cookieAuth: [] }],
  request: { params: categorySlugParamSchema },
  responses: {
    200: jsonContent(successSchema(categorySchema), "The category"),
    ...authErrorResponses,
  },
});

export const createRouteDef = createRoute({
  method: "post",
  path: "/",
  tags: [TAG],
  summary: "Create a category",
  security: [{ cookieAuth: [] }],
  request: {
    body: { content: { "application/json": { schema: createCategorySchema } } },
  },
  responses: {
    201: jsonContent(successSchema(z.object({ id: z.string() })), "Created"),
    ...authErrorResponses,
  },
});

export const updateRouteDef = createRoute({
  method: "patch",
  path: "/{slug}",
  tags: [TAG],
  summary: "Update a category",
  security: [{ cookieAuth: [] }],
  request: {
    params: categorySlugParamSchema,
    body: { content: { "application/json": { schema: updateCategorySchema } } },
  },
  responses: {
    200: jsonContent(
      successSchema(z.object({ ok: z.literal(true) })),
      "Updated",
    ),
    ...authErrorResponses,
  },
});

export const reorderRouteDef = createRoute({
  method: "put",
  path: "/reorder",
  tags: [TAG],
  summary: "Reorder categories for merchandising",
  security: [{ cookieAuth: [] }],
  request: {
    body: {
      content: { "application/json": { schema: reorderCategoriesSchema } },
    },
  },
  responses: {
    200: jsonContent(
      successSchema(z.object({ ok: z.literal(true) })),
      "Reordered",
    ),
    ...authErrorResponses,
  },
});

export const deleteRouteDef = createRoute({
  method: "delete",
  path: "/{slug}",
  tags: [TAG],
  summary: "Delete a category that no product uses",
  security: [{ cookieAuth: [] }],
  request: { params: categorySlugParamSchema },
  responses: {
    200: jsonContent(
      successSchema(z.object({ ok: z.literal(true) })),
      "Deleted",
    ),
    ...authErrorResponses,
  },
});
