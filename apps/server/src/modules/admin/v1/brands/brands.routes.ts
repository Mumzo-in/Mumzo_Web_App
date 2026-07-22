import { createRoute, z } from "@hono/zod-openapi";

import { authErrorResponses, jsonContent, successSchema } from "@/core";
import {
  brandIdParamSchema,
  brandSchema,
  createBrandSchema,
  updateBrandSchema,
} from "./brands.schema";

const TAG = "Admin | Catalog";

export const listRoute = createRoute({
  method: "get",
  path: "/",
  tags: [TAG],
  summary: "List brands",
  security: [{ cookieAuth: [] }],
  request: {
    query: z.object({
      search: z
        .string()
        .trim()
        .min(1)
        .optional()
        .openapi({ param: { name: "search", in: "query" } }),
    }),
  },
  responses: {
    200: jsonContent(successSchema(z.array(brandSchema)), "All brands"),
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
