import { createRoute, z } from "@hono/zod-openapi";

import { authErrorResponses, jsonContent, successSchema } from "@/core";
import {
  createServiceAreaSchema,
  serviceAreaIdParamSchema,
  serviceAreaSchema,
  updateServiceAreaSchema,
} from "./service-areas.schema";

const TAG = "Admin | Catalog";

export const listRoute = createRoute({
  method: "get",
  path: "/",
  tags: [TAG],
  summary: "List service areas (pincode → hub mapping)",
  security: [{ cookieAuth: [] }],
  responses: {
    200: jsonContent(
      successSchema(z.array(serviceAreaSchema)),
      "All service areas",
    ),
    ...authErrorResponses,
  },
});

export const createRouteDef = createRoute({
  method: "post",
  path: "/",
  tags: [TAG],
  summary: "Add a pincode to a hub's service area",
  security: [{ cookieAuth: [] }],
  request: {
    body: {
      content: { "application/json": { schema: createServiceAreaSchema } },
    },
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
  summary: "Update a service area",
  security: [{ cookieAuth: [] }],
  request: {
    params: serviceAreaIdParamSchema,
    body: {
      content: { "application/json": { schema: updateServiceAreaSchema } },
    },
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
  summary: "Remove a service area",
  security: [{ cookieAuth: [] }],
  request: { params: serviceAreaIdParamSchema },
  responses: {
    200: jsonContent(
      successSchema(z.object({ ok: z.literal(true) })),
      "Deleted",
    ),
    ...authErrorResponses,
  },
});
