import { z } from "@hono/zod-openapi";

export const cartItemIdParamSchema = z.object({
  id: z.uuid().openapi({ param: { name: "id", in: "path" } }),
});

export const getCartQuerySchema = z.object({
  pincode: z
    .string()
    .optional()
    .openapi({ param: { name: "pincode", in: "query" } }),
  lat: z.coerce
    .number()
    .optional()
    .openapi({ param: { name: "lat", in: "query" } }),
  lng: z.coerce
    .number()
    .optional()
    .openapi({ param: { name: "lng", in: "query" } }),
});

export const addCartItemSchema = z
  .object({
    productId: z.uuid(),
    productSizeId: z.uuid().nullable().optional(),
    productColorId: z.uuid().nullable().optional(),
    qty: z.number().int().min(1).default(1),
  })
  .openapi("AddCartItemInput");

export const updateCartItemSchema = z
  .object({
    qty: z.number().int().min(1),
  })
  .openapi("UpdateCartItemInput");

export const applyCouponSchema = z
  .object({
    code: z.string().min(1),
  })
  .openapi("ApplyCouponInput");

export const cartLineSchema = z
  .object({
    id: z.string(),
    productId: z.string(),
    productSizeId: z.string().nullable(),
    productColorId: z.string().nullable(),
    name: z.string(),
    brand: z.string(),
    img: z.string().nullable(),
    variantLabel: z.string().nullable(),
    price: z.number().int(),
    mrp: z.number().int(),
    qty: z.number().int(),
    stock: z.number().int(),
    isOutOfStock: z.boolean(),
  })
  .openapi("CartLine");

export const cartTotalsSchema = z
  .object({
    subtotal: z.number().int(),
    gstAmount: z.number().int(),
    deliveryFee: z.number().int(),
    discount: z.number().int(),
    total: z.number().int(),
    freeDeliveryThreshold: z.number().int(),
  })
  .openapi("CartTotals");

export const cartSchema = z
  .object({
    id: z.string(),
    items: cartLineSchema.array(),
    couponCode: z.string().nullable(),
    totals: cartTotalsSchema,
  })
  .openapi("Cart");
