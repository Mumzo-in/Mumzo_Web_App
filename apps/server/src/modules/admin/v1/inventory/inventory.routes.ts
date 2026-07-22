import { createRoute, z } from "@hono/zod-openapi";

import { authErrorResponses, jsonContent, successSchema } from "@/core";
import {
  adjustInventorySchema,
  inventoryRowSchema,
  listInventoryQuerySchema,
} from "./inventory.schema";

const TAG = "Admin | Catalog";

export const listRoute = createRoute({
  method: "get",
  path: "/",
  tags: [TAG],
  summary: "Per-hub stock grid",
  security: [{ cookieAuth: [] }],
  request: { query: listInventoryQuerySchema },
  responses: {
    200: jsonContent(
      successSchema(z.array(inventoryRowSchema)),
      "Inventory rows",
    ),
    ...authErrorResponses,
  },
});

export const adjustRouteDef = createRoute({
  method: "put",
  path: "/adjust",
  tags: [TAG],
  summary: "Set a hub's stock for a product",
  security: [{ cookieAuth: [] }],
  request: {
    body: {
      content: { "application/json": { schema: adjustInventorySchema } },
    },
  },
  responses: {
    200: jsonContent(
      successSchema(z.object({ ok: z.literal(true) })),
      "Adjusted",
    ),
    ...authErrorResponses,
  },
});
