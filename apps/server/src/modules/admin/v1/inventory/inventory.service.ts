import { badRequest, notFound } from "@/core/errors";
import * as inventoryRepo from "./inventory.repo";

const LOW_STOCK_THRESHOLD_FALLBACK = 12;

function toInventoryRow<
  T extends {
    productSizeId: string | null;
    sizeLabel: string | null;
    productColorId: string | null;
    colorLabel: string | null;
    stock: number;
    reorderPoint: number;
    updatedAt: Date;
  },
>(row: T) {
  return {
    ...row,
    variantLabel: row.sizeLabel ?? row.colorLabel ?? null,
    updatedAt: row.updatedAt.toISOString(),
    isLowStock:
      row.stock > 0 &&
      row.stock <= (row.reorderPoint || LOW_STOCK_THRESHOLD_FALLBACK),
  };
}

export async function listInventory(filters: {
  hubId?: string;
  productId?: string;
  search?: string;
  lowStockOnly?: boolean;
}) {
  const rows = await inventoryRepo.findAll(filters);
  return rows.map(toInventoryRow);
}

/**
 * Sets a hub's stock for a product (or one of its variants) to an absolute
 * value. Upserts — a hub carrying a product/variant for the first time has
 * no existing row yet. `productSizeId`/`productColorId` are mutually
 * exclusive, matching the cart/order rule (see `shared/pricing.ts`); pass
 * neither for a product with no variants.
 */
export async function adjustInventory(input: {
  hubId: string;
  productId: string;
  productSizeId?: string | null;
  productColorId?: string | null;
  stock: number;
  reorderPoint?: number;
}) {
  if (input.productSizeId && input.productColorId) {
    throw badRequest("Pick a size or a color, not both.");
  }

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

  const variantOk = await inventoryRepo.variantBelongsToProduct(
    input.productId,
    input.productSizeId ?? null,
    input.productColorId ?? null,
  );
  if (!variantOk) {
    throw badRequest("That variant doesn't belong to this product.");
  }

  await inventoryRepo.upsert(input);
}

/** A product's variants, for the "which variant" picker in the stock dialog
 * — empty arrays mean the product has none (stock is set at the product
 * level). */
export async function getProductVariants(productId: string) {
  return inventoryRepo.productVariants(productId);
}
