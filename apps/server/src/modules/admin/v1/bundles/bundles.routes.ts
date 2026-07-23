import { createRoute, z } from "@hono/zod-openapi";

import {
  authErrorResponses,
  jsonContent,
  paginatedSchema,
  successSchema,
} from "@/core";
import {
  bundleIdParamSchema,
  bundleSchema,
  createBundleSchema,
  listBundlesQuerySchema,
  updateBundleSchema,
} from "./bundles.schema";

const TAG = "Admin | Catalog";

export const listRoute = createRoute({
  method: "get",
  path: "/",
  tags: [TAG],
  summary: "List bundles",
  security: [{ cookieAuth: [] }],
  request: { query: listBundlesQuerySchema },
  responses: {
    200: jsonContent(paginatedSchema(bundleSchema), "Page of bundles"),
    ...authErrorResponses,
  },
});

export const getRoute = createRoute({
  method: "get",
  path: "/{id}",
  tags: [TAG],
  summary: "Get a bundle",
  security: [{ cookieAuth: [] }],
  request: { params: bundleIdParamSchema },
  responses: {
    200: jsonContent(successSchema(bundleSchema), "The bundle"),
    ...authErrorResponses,
  },
});

export const createRouteDef = createRoute({
  method: "post",
  path: "/",
  tags: [TAG],
  summary: "Create a bundle",
  security: [{ cookieAuth: [] }],
  request: {
    body: { content: { "application/json": { schema: createBundleSchema } } },
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
  summary: "Replace a bundle",
  security: [{ cookieAuth: [] }],
  request: {
    params: bundleIdParamSchema,
    body: { content: { "application/json": { schema: updateBundleSchema } } },
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
  summary: "Delete a bundle",
  security: [{ cookieAuth: [] }],
  request: { params: bundleIdParamSchema },
  responses: {
    200: jsonContent(
      successSchema(z.object({ ok: z.literal(true) })),
      "Deleted",
    ),
    ...authErrorResponses,
  },
});
