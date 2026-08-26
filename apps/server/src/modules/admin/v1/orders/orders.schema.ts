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
  /** Required when dispatching (`out_for_delivery`) — the rider who is taking
   * the order. Binding it here means the delivery link is tied to one person
   * from the moment it is minted. */
  riderId: z.string().uuid().optional(),
});

/** One line item for a manually-created (phone/walk-in) order — a product
 * plus, optionally, which size/color variant, and how many units. */
export const createOrderLineSchema = z
  .object({
    productId: z.uuid(),
    productSizeId: z.uuid().nullable().optional(),
    productColorId: z.uuid().nullable().optional(),
    qty: z.number().int().positive(),
  })
  .openapi("CreateOrderLine");

/**
 * Admin-side manual order creation — no cart, no logged-in customer
 * session. The hub is picked explicitly by staff (not auto-resolved from
 * geolocation) and the address is entered ad-hoc rather than pulled from a
 * saved `address` row, since phone orders rarely have one on file yet.
 */
export const createOrderSchema = z
  .object({
    hubId: z.uuid(),
    customerId: z.string().min(1).optional(),
    customerName: z.string().trim().min(1).max(120),
    customerPhone: z.string().trim().min(6).max(20),
    addressLine1: z.string().trim().min(1).max(200),
    addressLine2: z.string().trim().max(200).optional(),
    addressLandmark: z.string().trim().max(200).optional(),
    addressPincode: z.string().trim().min(4).max(10),
    addressCity: z.string().trim().min(1).max(100),
    addressLabel: z.string().trim().max(40).default("Manual order"),
    items: createOrderLineSchema.array().min(1),
    note: z.string().max(500).optional(),
  })
  .openapi("CreateOrder");

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
    addressLat: z.number().nullable(),
    addressLng: z.number().nullable(),
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

/** The rider link for a dispatched order. `token` is null when the order has
 * not been dispatched yet. */
export const deliveryLinkSchema = z.object({
  token: z.string().nullable(),
  outcome: z.string().nullable(),
  riderName: z.string().nullable(),
  riderPhone: z.string().nullable(),
  /** The assigned rider's standing code — what ops reads out to them. */
  accessCode: z.string().nullable(),
});

export const assignRiderSchema = z.object({
  riderId: z.string().uuid(),
});
