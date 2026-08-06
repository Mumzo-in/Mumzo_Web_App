import { createRoute, z } from "@hono/zod-openapi";

import {
  authErrorResponses,
  jsonContent,
  paginatedSchema,
  successSchema,
} from "@/core";
import {
  brandIdParamSchema,
  brandSchema,
  createBrandSchema,
  listBrandsQuerySchema,
  updateBrandSchema,
} from "./brands.schema";

const TAG = "Admin | Catalog";

export const listRoute = createRoute({
  method: "get",
  path: "/",
  tags: [TAG],
  summary: "List brands, paginated",
  security: [{ cookieAuth: [] }],
  request: { query: listBrandsQuerySchema },
  responses: {
    200: jsonContent(paginatedSchema(brandSchema), "Page of brands"),
    ...authErrorResponses,
  },
});

export const getRoute = createRoute({
  method: "get",
  path: "/{id}",
  tags: [TAG],
  summary: "Get a brand by id",
  security: [{ cookieAuth: [] }],
  request: { params: brandIdParamSchema },
  responses: {
    200: jsonContent(successSchema(brandSchema), "The brand"),
    ...authErrorResponses,
  },
});

export const createRouteDef = createRoute({
  method: "post",
  path: "/",
  tags: [TAG],
  summary: "Create a brand",
  security: [{ cookieAuth: [] }],
  request: {
    body: { content: { "application/json": { schema: createBrandSchema } } },
  },
  responses: {
    201: jsonContent(successSchema(z.object({ id: z.string() })), "Created"),
    ...authErrorResponses,
  },
});

export const updateRouteDef = createRoute({
  method: "patch",
  path: "/{id}",
  tags: [TAG],
  summary: "Update a brand",
  security: [{ cookieAuth: [] }],
  request: {
    params: brandIdParamSchema,
    body: { content: { "application/json": { schema: updateBrandSchema } } },
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
  summary: "Delete a brand that no product uses",
  security: [{ cookieAuth: [] }],
  request: { params: brandIdParamSchema },
  responses: {
    200: jsonContent(
      successSchema(z.object({ ok: z.literal(true) })),
      "Deleted",
    ),
    ...authErrorResponses,
  },
});
