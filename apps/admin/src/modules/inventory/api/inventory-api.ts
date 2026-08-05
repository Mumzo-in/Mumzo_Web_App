import { mockDelay, mockId } from "@/core/api/mock";
import { hubs } from "../../hub/data/hub-data";
import { products } from "../../product/data/product-data";
import { inventoryRows } from "../data/inventory-data";

export type InventoryRow = {
  id: string;
  hubId: string;
  hubName: string;
  productId: string;
  productName: string;
  sku: string;
  productSizeId: string | null;
  productColorId: string | null;
  /** Size/color label, whichever applies — null for a variant-less product. */
  variantLabel: string | null;
  stock: number;
  reorderPoint: number;
  isLowStock: boolean;
  updatedAt: string;
};

export type InventoryFilters = {
  hubId?: string;
  productId?: string;
  search?: string;
  lowStockOnly?: boolean;
};

export async function listInventory(
  filters: InventoryFilters = {},
): Promise<InventoryRow[]> {
  await mockDelay();
  const needle = filters.search?.trim().toLowerCase();
  return inventoryRows.filter((row) => {
    if (filters.hubId && row.hubId !== filters.hubId) {
      return false;
    }
    if (filters.productId && row.productId !== filters.productId) {
      return false;
    }
    if (filters.lowStockOnly && !row.isLowStock) {
      return false;
    }
    if (
      needle &&
      !row.productName.toLowerCase().includes(needle) &&
      !row.sku.toLowerCase().includes(needle)
    ) {
      return false;
    }
    return true;
  });
}

export type ProductVariantOption = { id: string; label: string };

export type ProductVariants = {
  sizes: ProductVariantOption[];
  colors: ProductVariantOption[];
};

export async function getProductVariants(
  productId: string,
): Promise<ProductVariants> {
  await mockDelay();
  const product = products.find((row) => row.id === productId);
  return {
    sizes: (product?.sizes ?? [])
      .filter((size) => size.id)
      .map((size) => ({ id: size.id as string, label: size.label })),
    colors: (product?.colors ?? [])
      .filter((color) => color.id)
      .map((color) => ({ id: color.id as string, label: color.label })),
  };
}

export type AdjustInventoryInput = {
  hubId: string;
  productId: string;
  productSizeId?: string | null;
  productColorId?: string | null;
  stock: number;
  reorderPoint?: number;
  reason?: string;
};

/**
 * Upserts a row by `hubId` + `productId` + variant (size/color id). Matches
 * an existing row and patches it, or creates a new one — the mock stand-in
 * for the real `PUT /inventory/adjust` endpoint's upsert behavior.
 */
export async function adjustInventory(
  input: AdjustInventoryInput,
): Promise<{ ok: true }> {
  await mockDelay();
  const productSizeId = input.productSizeId ?? null;
  const productColorId = input.productColorId ?? null;

  const index = inventoryRows.findIndex(
    (row) =>
      row.hubId === input.hubId &&
      row.productId === input.productId &&
      row.productSizeId === productSizeId &&
      row.productColorId === productColorId,
  );

  const reorderPoint =
    input.reorderPoint ?? inventoryRows[index]?.reorderPoint ?? 10;
  const isLowStock = input.stock > 0 && input.stock <= reorderPoint;

  if (index !== -1) {
    inventoryRows[index] = {
      ...inventoryRows[index],
      stock: input.stock,
      reorderPoint,
      isLowStock,
      updatedAt: new Date().toISOString(),
    };
    return { ok: true };
  }

  const product = products.find((row) => row.id === input.productId);
  const variant =
    product?.sizes.find((size) => size.id === productSizeId) ??
    product?.colors.find((color) => color.id === productColorId);
  const hub = hubs.find((row) => row.id === input.hubId);

  inventoryRows.push({
    id: mockId("inv"),
    hubId: input.hubId,
    hubName: hub?.name ?? "",
    productId: input.productId,
    productName: product?.name ?? "",
    sku: product?.sku ?? "",
    productSizeId,
    productColorId,
    variantLabel: variant?.label ?? null,
    stock: input.stock,
    reorderPoint,
    isLowStock,
    updatedAt: new Date().toISOString(),
  });
  return { ok: true };
}
