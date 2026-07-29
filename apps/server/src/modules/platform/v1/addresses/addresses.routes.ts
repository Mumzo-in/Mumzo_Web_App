import { createRoute, z } from "@hono/zod-openapi";

import { commonErrorResponses, jsonContent, successSchema } from "@/core";
import {
  addressIdParamSchema,
  addressSchema,
  createAddressSchema,
  updateAddressSchema,
} from "./addresses.schema";

const TAG = "Platform | Addresses";

export const listRoute = createRoute({
  method: "get",
  path: "/",
  tags: [TAG],
  summary: "List the signed-in customer's saved addresses",
  responses: {
    200: jsonContent(successSchema(addressSchema.array()), "Saved addresses"),
    ...commonErrorResponses,
  },
});

export const createRouteDef = createRoute({
  method: "post",
  path: "/",
  tags: [TAG],
  summary: "Save a new address",
  request: {
    body: { content: { "application/json": { schema: createAddressSchema } } },
  },
  responses: {
    201: jsonContent(successSchema(addressSchema), "Created"),
    ...commonErrorResponses,
  },
});

export const updateRouteDef = createRoute({
  method: "patch",
  path: "/{id}",
  tags: [TAG],
  summary: "Update a saved address",
  request: {
    params: addressIdParamSchema,
    body: { content: { "application/json": { schema: updateAddressSchema } } },
  },
  responses: {
    200: jsonContent(successSchema(addressSchema), "Updated"),
    ...commonErrorResponses,
  },
});

export const deleteRouteDef = createRoute({
  method: "delete",
  path: "/{id}",
  tags: [TAG],
  summary: "Delete a saved address",
  request: { params: addressIdParamSchema },
  responses: {
    200: jsonContent(
      successSchema(z.object({ ok: z.literal(true) })),
      "Deleted",
    ),
    ...commonErrorResponses,
  },
});

export const setDefaultRouteDef = createRoute({
  method: "post",
  path: "/{id}/default",
  tags: [TAG],
  summary: "Set an address as the default",
  request: { params: addressIdParamSchema },
  responses: {
    200: jsonContent(
      successSchema(z.object({ ok: z.literal(true) })),
      "Default updated",
    ),
    ...commonErrorResponses,
  },
});
