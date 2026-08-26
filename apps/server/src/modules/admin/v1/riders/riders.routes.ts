import { createRoute } from "@hono/zod-openapi";

import {
  authErrorResponses,
  jsonContent,
  paginatedSchema,
  successSchema,
} from "@/core";
import {
  createRiderSchema,
  deleteRiderSchema,
  listRidersQuerySchema,
  riderIdParamSchema,
  riderSchema,
  updateRiderSchema,
} from "./riders.schema";

const TAG = "Admin | Riders";

export const listRoute = createRoute({
  method: "get",
  path: "/",
  tags: [TAG],
  summary: "List delivery partners",
  security: [{ cookieAuth: [] }],
  request: { query: listRidersQuerySchema },
  responses: {
    200: jsonContent(paginatedSchema(riderSchema), "Riders"),
    ...authErrorResponses,
  },
});

export const getRiderRoute = createRoute({
  method: "get",
  path: "/{id}",
  tags: [TAG],
  summary: "Get one delivery partner",
  security: [{ cookieAuth: [] }],
  request: { params: riderIdParamSchema },
  responses: {
    200: jsonContent(successSchema(riderSchema), "Rider"),
    ...authErrorResponses,
  },
});

export const createRiderRoute = createRoute({
  method: "post",
  path: "/",
  tags: [TAG],
  summary: "Add a delivery partner (access code is generated)",
  security: [{ cookieAuth: [] }],
  request: {
    body: { content: { "application/json": { schema: createRiderSchema } } },
  },
  responses: {
    200: jsonContent(successSchema(riderSchema), "Rider created"),
    ...authErrorResponses,
  },
});

export const updateRiderRoute = createRoute({
  method: "patch",
  path: "/{id}",
  tags: [TAG],
  summary: "Update a delivery partner",
  security: [{ cookieAuth: [] }],
  request: {
    params: riderIdParamSchema,
    body: { content: { "application/json": { schema: updateRiderSchema } } },
  },
  responses: {
    200: jsonContent(successSchema(riderSchema), "Rider updated"),
    ...authErrorResponses,
  },
});

export const rotateCodeRoute = createRoute({
  method: "post",
  path: "/{id}/rotate-code",
  tags: [TAG],
  summary: "Issue a fresh access code for a rider",
  security: [{ cookieAuth: [] }],
  request: { params: riderIdParamSchema },
  responses: {
    200: jsonContent(successSchema(riderSchema), "Code rotated"),
    ...authErrorResponses,
  },
});

export const deleteRiderRoute = createRoute({
  method: "delete",
  path: "/{id}",
  tags: [TAG],
  summary: "Remove a delivery partner (deactivates if they have history)",
  security: [{ cookieAuth: [] }],
  request: { params: riderIdParamSchema },
  responses: {
    200: jsonContent(successSchema(deleteRiderSchema), "Rider removed"),
    ...authErrorResponses,
  },
});
