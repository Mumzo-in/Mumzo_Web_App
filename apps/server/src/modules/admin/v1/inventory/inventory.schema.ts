import { z } from "@hono/zod-openapi";

export const inventoryRowSchema = z
  .object({
    hubId: z.string(),
    hubName: z.string(),
    productId: z.string(),
    productName: z.string(),
    sku: z.string(),
    stock: z.number().int(),
    reorderPoint: z.number().int(),
    isLowStock: z.boolean(),
    updatedAt: z.string(),
  })
  .openapi("InventoryRow");

export const listInventoryQuerySchema = z.object({
  hubId: z
    .string()
    .optional()
    .openapi({ param: { name: "hubId", in: "query" } }),
  search: z
    .string()
    .trim()
    .min(1)
    .optional()
    .openapi({ param: { name: "search", in: "query" } }),
  lowStockOnly: z.coerce
    .boolean()
    .optional()
    .openapi({ param: { name: "lowStockOnly", in: "query" } }),
});

/**
 * Sets stock to an absolute value rather than a delta — the admin UI shows
 * the current count and the operator types the new one, which is less
 * error-prone than "+/- N" for a manual recount.
 */
export const adjustInventorySchema = z.object({
  hubId: z.string().min(1),
  productId: z.string().min(1),
  stock: z.number().int().min(0),
  reorderPoint: z.number().int().min(0).optional(),
  /** Free-text audit note — not yet stored, logged for the future adjustments ledger. */
  reason: z.string().max(200).optional(),
});
