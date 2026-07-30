import { z } from "@hono/zod-openapi";

export const orderIdParamSchema = z.object({
  id: z.uuid().openapi({ param: { name: "id", in: "path" } }),
});

export const listOrdersQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

/** COD only for now — `method`/online payment intentionally absent until
 * the Razorpay module exists (see docs/order-checkout-flow.md §6/§9). */
export const placeOrderSchema = z.object({
  addressId: z.uuid(),
  /** Client-generated — survives double-clicks and retried requests without
   * creating duplicate orders (docs/order-checkout-flow.md §10). */
  idempotencyKey: z.string().min(1).max(200),
});

export const cancelOrderSchema = z.object({
  reason: z.string().max(500).optional(),
});

export const orderItemSchema = z
  .object({
    id: z.string(),
    productId: z.string(),
    name: z.string(),
    variantLabel: z.string().nullable(),
    price: z.number().int(),
    qty: z.number().int(),
  })
  .openapi("OrderItem");

export const orderStatusLogEntrySchema = z
  .object({
    id: z.string(),
    fromStatus: z.string().nullable(),
    toStatus: z.string(),
    actor: z.string(),
    note: z.string().nullable(),
    createdAt: z.string(),
  })
  .openapi("OrderStatusLogEntry");

export const orderSummarySchema = z
  .object({
    id: z.string(),
    status: z.string(),
    itemCount: z.number().int(),
    subtotal: z.number().int(),
    total: z.number().int(),
    placedAt: z.string(),
  })
  .openapi("OrderSummary");

export const orderDetailSchema = z
  .object({
    id: z.string(),
    status: z.string(),
    addressLabel: z.string(),
    addressName: z.string(),
    addressPhone: z.string(),
    addressLine1: z.string(),
    addressLine2: z.string(),
    addressLandmark: z.string().nullable(),
    addressPincode: z.string(),
    addressCity: z.string(),
    subtotal: z.number().int(),
    gstAmount: z.number().int(),
    deliveryFee: z.number().int(),
    discount: z.number().int(),
    total: z.number().int(),
    items: orderItemSchema.array(),
    statusLog: orderStatusLogEntrySchema.array(),
    placedAt: z.string(),
  })
  .openapi("OrderDetail");
