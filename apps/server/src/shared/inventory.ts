import { db } from "@mumzo/db";
import { inventory } from "@mumzo/db/schema/catalog";
import { and, eq, inArray } from "drizzle-orm";

export interface InventoryStock {
  /** Total stock summed across every variant at the resolved hub. */
  total: number;
  /** Per-variant stock, keyed by `productSizeId`/`productColorId` (or
   * `"base"` for a variant-less product), for size/color-level availability. */
  byVariant: Map<string, number>;
}

const BASE_VARIANT_KEY = "base";

/** Real per-hub stock for a batch of products, keyed by product id — the
 * listing/detail endpoints' replacement for the legacy
 * `productSize.stock`/`productColor.stock` rollup, which never reflects the
 * admin Inventory panel's edits. */
export async function inventoryStockByProductId(
  productIds: string[],
  hubId: string,
): Promise<Map<string, InventoryStock>> {
  const result = new Map<string, InventoryStock>();
  if (productIds.length === 0) {
    return result;
  }

  const rows = await db
    .select({
      productId: inventory.productId,
      productSizeId: inventory.productSizeId,
      productColorId: inventory.productColorId,
      stock: inventory.stock,
    })
    .from(inventory)
    .where(
      and(eq(inventory.hubId, hubId), inArray(inventory.productId, productIds)),
    );

  for (const row of rows) {
    const entry = result.get(row.productId) ?? {
      total: 0,
      byVariant: new Map<string, number>(),
    };
    entry.total += row.stock;
    const variantKey =
      row.productSizeId ?? row.productColorId ?? BASE_VARIANT_KEY;
    entry.byVariant.set(
      variantKey,
      (entry.byVariant.get(variantKey) ?? 0) + row.stock,
    );
    result.set(row.productId, entry);
  }

  return result;
}
