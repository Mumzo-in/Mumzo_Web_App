import { z } from "@hono/zod-openapi";

export const refundRowSchema = z
  .object({
    id: z.string(),
    orderId: z.string(),
    customerName: z.string(),
    amount: z.number().int(),
    reason: z.string(),
    status: z.string(),
    createdAt: z.string(),
  })
  .openapi("AdminRefundRow");

export const listRefundsQuerySchema = z.object({
  status: z.string().optional(),
});
