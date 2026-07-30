import { z } from "@hono/zod-openapi";

export const inventoryRowSchema = z
  .object({
    id: z.string(),
    hubId: z.string(),
    hubName: z.string(),
    productId: z.string(),
    productName: z.string(),
    sku: z.string(),
    productSizeId: z.string().nullable(),
    productColorId: z.string().nullable(),
    /** Size/color label, whichever applies — null for a variant-less product. */
    variantLabel: z.string().nullable(),
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
  productId: z
    .string()
    .optional()
    .openapi({ param: { name: "productId", in: "query" } }),
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
 * error-prone than "+/- N" for a manual recount. `productSizeId`/
 * `productColorId` are mutually exclusive — omit both for a product with no
 * variants.
 */
export const adjustInventorySchema = z.object({
  hubId: z.string().min(1),
  productId: z.string().min(1),
  productSizeId: z.string().nullable().optional(),
  productColorId: z.string().nullable().optional(),
  stock: z.number().int().min(0),
  reorderPoint: z.number().int().min(0).optional(),
  /** Free-text audit note — not yet stored, logged for the future adjustments ledger. */
  reason: z.string().max(200).optional(),
});

export const productIdParamSchema = z.object({
  productId: z
    .string()
    .min(1)
    .openapi({ param: { name: "productId", in: "path" } }),
});

export const productVariantOptionSchema = z.object({
  id: z.string(),
  label: z.string(),
});

export const productVariantsSchema = z.object({
  sizes: z.array(productVariantOptionSchema),
  colors: z.array(productVariantOptionSchema),
});
