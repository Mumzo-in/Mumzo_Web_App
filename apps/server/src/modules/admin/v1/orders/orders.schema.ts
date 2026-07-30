import { z } from "@hono/zod-openapi";

export const orderIdParamSchema = z.object({
  id: z.uuid().openapi({ param: { name: "id", in: "path" } }),
});

export const ORDER_STATUSES = [
  "pending_payment",
  "confirmed",
  "packed",
  "shipped",
  "out_for_delivery",
  "delivered",
  "cancelled",
  "return_requested",
  "returned",
] as const;

export const listOrdersQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(500).default(20),
  status: z.enum(ORDER_STATUSES).optional(),
  hubId: z.string().optional(),
  search: z.string().trim().min(1).optional(),
});

/** Mirrors docs/order-checkout-flow.md's status graph — same set the
 * customer-facing `OrderStatusTimeline` already renders. */
export const updateOrderStatusSchema = z.object({
  status: z.enum(ORDER_STATUSES),
  note: z.string().max(500).optional(),
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
  .openapi("AdminOrderItem");

export const orderStatusLogEntrySchema = z
  .object({
    id: z.string(),
    fromStatus: z.string().nullable(),
    toStatus: z.string(),
    actor: z.string(),
    note: z.string().nullable(),
    createdAt: z.string(),
  })
  .openapi("AdminOrderStatusLogEntry");

export const orderSummarySchema = z
  .object({
    id: z.string(),
    status: z.string(),
    customerName: z.string(),
    hubName: z.string(),
    itemCount: z.number().int(),
    total: z.number().int(),
    paymentMethod: z.string(),
    placedAt: z.string(),
  })
  .openapi("AdminOrderSummary");

export const orderDetailSchema = z
  .object({
    id: z.string(),
    status: z.string(),
    customerName: z.string(),
    customerId: z.string(),
    hubName: z.string(),
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
    paymentMethod: z.string(),
    paymentStatus: z.string(),
    items: orderItemSchema.array(),
    statusLog: orderStatusLogEntrySchema.array(),
    placedAt: z.string(),
  })
  .openapi("AdminOrderDetail");
