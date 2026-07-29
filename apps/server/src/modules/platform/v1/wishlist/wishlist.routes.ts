import { createRoute, z } from "@hono/zod-openapi";

import { commonErrorResponses, jsonContent, successSchema } from "@/core";
import { productIdParamSchema, wishlistIdsSchema } from "./wishlist.schema";

const TAG = "Platform | Wishlist";

export const listRoute = createRoute({
  method: "get",
  path: "/",
  tags: [TAG],
  summary: "List the signed-in customer's wishlisted product ids",
  responses: {
    200: jsonContent(
      successSchema(wishlistIdsSchema),
      "Wishlisted product ids",
    ),
    ...commonErrorResponses,
  },
});

export const addRouteDef = createRoute({
  method: "post",
  path: "/{productId}",
  tags: [TAG],
  summary: "Add a product to the wishlist",
  request: { params: productIdParamSchema },
  responses: {
    200: jsonContent(successSchema(z.object({ ok: z.literal(true) })), "Added"),
    ...commonErrorResponses,
  },
});

export const removeRouteDef = createRoute({
  method: "delete",
  path: "/{productId}",
  tags: [TAG],
  summary: "Remove a product from the wishlist",
  request: { params: productIdParamSchema },
  responses: {
    200: jsonContent(
      successSchema(z.object({ ok: z.literal(true) })),
      "Removed",
    ),
    ...commonErrorResponses,
  },
});
