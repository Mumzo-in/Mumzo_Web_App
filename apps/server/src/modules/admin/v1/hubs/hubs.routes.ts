import { createRoute, z } from "@hono/zod-openapi";

import { authErrorResponses, jsonContent, successSchema } from "@/core";
import {
  createHubSchema,
  hubIdParamSchema,
  hubSchema,
  updateHubSchema,
} from "./hubs.schema";

const TAG = "Admin | Catalog";

export const listRoute = createRoute({
  method: "get",
  path: "/",
  tags: [TAG],
  summary: "List dark-store hubs",
  security: [{ cookieAuth: [] }],
  responses: {
    200: jsonContent(successSchema(z.array(hubSchema)), "All hubs"),
    ...authErrorResponses,
  },
});

export const createRouteDef = createRoute({
  method: "post",
  path: "/",
  tags: [TAG],
  summary: "Create a hub",
  security: [{ cookieAuth: [] }],
  request: {
    body: { content: { "application/json": { schema: createHubSchema } } },
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
  summary: "Update a hub",
  security: [{ cookieAuth: [] }],
  request: {
    params: hubIdParamSchema,
    body: { content: { "application/json": { schema: updateHubSchema } } },
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
  summary: "Delete a hub with no inventory on hand",
  security: [{ cookieAuth: [] }],
  request: { params: hubIdParamSchema },
  responses: {
    200: jsonContent(
      successSchema(z.object({ ok: z.literal(true) })),
      "Deleted",
    ),
    ...authErrorResponses,
  },
});
