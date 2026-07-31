import { createRoute } from "@hono/zod-openapi";

import { commonErrorResponses, jsonContent, successSchema } from "@/core";
import {
  addCartItemSchema,
  applyCouponSchema,
  cartItemIdParamSchema,
  cartSchema,
  getCartQuerySchema,
  updateCartItemSchema,
} from "./cart.schema";

const TAG = "Platform | Cart";

export const getCartRoute = createRoute({
  method: "get",
  path: "/",
  tags: [TAG],
  summary: "Get the current cart (guest or signed-in) with live totals",
  request: { query: getCartQuerySchema },
  responses: {
    200: jsonContent(successSchema(cartSchema), "The cart"),
    ...commonErrorResponses,
  },
});

export const addItemRoute = createRoute({
  method: "post",
  path: "/items",
  tags: [TAG],
  summary: "Add an item to the cart",
  request: {
    body: { content: { "application/json": { schema: addCartItemSchema } } },
  },
  responses: {
    201: jsonContent(successSchema(cartSchema), "Updated cart"),
    ...commonErrorResponses,
  },
});

export const updateItemRoute = createRoute({
  method: "patch",
  path: "/items/{id}",
  tags: [TAG],
  summary: "Update a cart line's quantity",
  request: {
    params: cartItemIdParamSchema,
    body: {
      content: { "application/json": { schema: updateCartItemSchema } },
    },
  },
  responses: {
    200: jsonContent(successSchema(cartSchema), "Updated cart"),
    ...commonErrorResponses,
  },
});

export const removeItemRoute = createRoute({
  method: "delete",
  path: "/items/{id}",
  tags: [TAG],
  summary: "Remove a line from the cart",
  request: { params: cartItemIdParamSchema },
  responses: {
    200: jsonContent(successSchema(cartSchema), "Updated cart"),
    ...commonErrorResponses,
  },
});

export const applyCouponRoute = createRoute({
  method: "post",
  path: "/coupon",
  tags: [TAG],
  summary: "Apply a coupon code to the cart",
  request: {
    body: { content: { "application/json": { schema: applyCouponSchema } } },
  },
  responses: {
    200: jsonContent(successSchema(cartSchema), "Updated cart"),
    ...commonErrorResponses,
  },
});

export const removeCouponRoute = createRoute({
  method: "delete",
  path: "/coupon",
  tags: [TAG],
  summary: "Remove the applied coupon",
  responses: {
    200: jsonContent(successSchema(cartSchema), "Updated cart"),
    ...commonErrorResponses,
  },
});

export const clearCartRoute = createRoute({
  method: "delete",
  path: "/",
  tags: [TAG],
  summary: "Clear the cart",
  responses: {
    200: jsonContent(successSchema(cartSchema), "Emptied cart"),
    ...commonErrorResponses,
  },
});

export const mergeCartRoute = createRoute({
  method: "post",
  path: "/merge",
  tags: [TAG],
  summary: "Merge the guest cart into the signed-in user's cart",
  responses: {
    200: jsonContent(successSchema(cartSchema), "Merged cart"),
    ...commonErrorResponses,
  },
});
