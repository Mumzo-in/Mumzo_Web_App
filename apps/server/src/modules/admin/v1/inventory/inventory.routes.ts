import { createRoute, z } from "@hono/zod-openapi";

import { authErrorResponses, jsonContent, successSchema } from "@/core";
import {
  adjustInventorySchema,
  inventoryRowSchema,
  listInventoryQuerySchema,
  productIdParamSchema,
  productVariantsSchema,
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

export const productVariantsRoute = createRoute({
  method: "get",
  path: "/products/{productId}/variants",
  tags: [TAG],
  summary: "A product's sizes/colors, for the stock dialog's variant picker",
  security: [{ cookieAuth: [] }],
  request: { params: productIdParamSchema },
  responses: {
    200: jsonContent(successSchema(productVariantsSchema), "Variants"),
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
