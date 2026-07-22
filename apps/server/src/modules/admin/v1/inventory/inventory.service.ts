import { notFound } from "@/core/errors";
import * as inventoryRepo from "./inventory.repo";

const LOW_STOCK_THRESHOLD_FALLBACK = 12;

export async function listInventory(filters: {
  hubId?: string;
  search?: string;
  lowStockOnly?: boolean;
}) {
  const rows = await inventoryRepo.findAll(filters);

  return rows.map((row) => ({
    ...row,
    updatedAt: row.updatedAt.toISOString(),
    isLowStock:
      row.stock > 0 &&
      row.stock <= (row.reorderPoint || LOW_STOCK_THRESHOLD_FALLBACK),
  }));
}

/**
 * Sets a hub's stock for a product to an absolute value. Upserts — a hub
 * carrying a product for the first time has no existing row yet.
 */
export async function adjustInventory(input: {
  hubId: string;
  productId: string;
  stock: number;
  reorderPoint?: number;
}) {
  const [hubOk, productOk] = await Promise.all([
    inventoryRepo.hubExists(input.hubId),
    inventoryRepo.productExists(input.productId),
  ]);

  if (!hubOk) {
    throw notFound("Hub");
  }
  if (!productOk) {
    throw notFound("Product");
  }

  await inventoryRepo.upsert(input);
}
