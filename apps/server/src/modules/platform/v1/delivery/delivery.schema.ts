import { z } from "@hono/zod-openapi";

export const deliveryTokenParamSchema = z.object({
  token: z.string().min(1).openapi({ description: "Delivery link token" }),
});

/** The code travels in the body, never the query string — query params land
 * in server logs and browser history. */
export const deliveryCodeSchema = z.object({
  code: z.string().min(1).max(32),
});

export const deliveryOutcomeSchema = z.object({
  code: z.string().min(1).max(32),
  outcome: z.enum(["delivered", "cancelled", "returned"]),
  reason: z.string().max(500).optional(),
});

export const deliveryStatusSchema = z.object({
  token: z.string(),
  locked: z.boolean(),
  outcome: z.enum(["delivered", "cancelled", "returned"]).nullable(),
  lockedOut: z.boolean(),
});

const deliveryItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  variantLabel: z.string().nullable(),
  qty: z.number(),
});

export const deliveryRunSchema = z.object({
  token: z.string(),
  orderId: z.string(),
  status: z.enum(["out_for_delivery", "delivered", "cancelled", "returned"]),
  riderId: z.string(),
  riderName: z.string().nullable(),
  customerName: z.string(),
  customerPhone: z.string(),
  addressLabel: z.string(),
  addressLine1: z.string(),
  addressLine2: z.string(),
  addressLandmark: z.string().nullable(),
  addressCity: z.string(),
  addressPincode: z.string(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  hubName: z.string(),
  itemCount: z.number(),
  items: z.array(deliveryItemSchema),
  total: z.number(),
  paymentMethod: z.string(),
  collectCash: z.boolean(),
  dispatchedAt: z.string(),
  completedAt: z.string().nullable(),
  completionReason: z.string().nullable(),
});
