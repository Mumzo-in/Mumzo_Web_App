import { createRoute, z } from "@hono/zod-openapi";

import {
  authErrorResponses,
  jsonContent,
  paginatedSchema,
  successSchema,
} from "@/core";
import {
  createVendorSchema,
  listVendorsQuerySchema,
  updateVendorSchema,
  vendorIdParamSchema,
  vendorSchema,
} from "./vendors.schema";

const TAG = "Admin | Catalog";

export const listRoute = createRoute({
  method: "get",
  path: "/",
  tags: [TAG],
  summary: "List vendors",
  security: [{ cookieAuth: [] }],
  request: { query: listVendorsQuerySchema },
  responses: {
    200: jsonContent(paginatedSchema(vendorSchema), "Page of vendors"),
    ...authErrorResponses,
  },
});

export const getRoute = createRoute({
  method: "get",
  path: "/{id}",
  tags: [TAG],
  summary: "Get a vendor",
  security: [{ cookieAuth: [] }],
  request: { params: vendorIdParamSchema },
  responses: {
    200: jsonContent(successSchema(vendorSchema), "The vendor"),
    ...authErrorResponses,
  },
});

export const createRouteDef = createRoute({
  method: "post",
  path: "/",
  tags: [TAG],
  summary: "Create a vendor",
  security: [{ cookieAuth: [] }],
  request: {
    body: { content: { "application/json": { schema: createVendorSchema } } },
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
  summary: "Update a vendor",
  security: [{ cookieAuth: [] }],
  request: {
    params: vendorIdParamSchema,
    body: { content: { "application/json": { schema: updateVendorSchema } } },
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
  summary: "Delete a vendor that no product uses",
  security: [{ cookieAuth: [] }],
  request: { params: vendorIdParamSchema },
  responses: {
    200: jsonContent(
      successSchema(z.object({ ok: z.literal(true) })),
      "Deleted",
    ),
    ...authErrorResponses,
  },
});
