import { apiRequest } from "@/core/api/client";

export type InventoryRow = {
  id: string;
  hubId: string;
  hubName: string;
  productId: string;
  productName: string;
  sku: string;
  productSizeId: string | null;
  productColorId: string | null;
  variantLabel: string | null;
  stock: number;
  reorderPoint: number;
  isLowStock: boolean;
  updatedAt: string;
};

/** Per-hub stock rows for a single product. */
export function listProductInventory(
  productId: string,
): Promise<InventoryRow[]> {
  return apiRequest<InventoryRow[]>("/inventory", { query: { productId } });
}

export type Hub = {
  id: string;
  name: string;
  address: string;
  isActive: boolean;
  isDefault: boolean;
};

export function listAllHubs(): Promise<Hub[]> {
  return apiRequest<Hub[]>("/hubs");
}

/** Sets one hub's stock for a product/variant to an absolute value —
 * upserts, so a hub carrying this product for the first time is fine. */
export function adjustInventory(input: {
  hubId: string;
  productId: string;
  productSizeId?: string | null;
  productColorId?: string | null;
  stock: number;
}): Promise<{ ok: true }> {
  return apiRequest<{ ok: true }>("/inventory/adjust", {
    method: "PUT",
    body: input,
  });
}
