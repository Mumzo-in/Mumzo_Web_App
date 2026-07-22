import { apiRequest } from "@/core/api/client";

export type InventoryRow = {
  hubId: string;
  hubName: string;
  productId: string;
  productName: string;
  sku: string;
  stock: number;
  reorderPoint: number;
  isLowStock: boolean;
  updatedAt: string;
};

export type InventoryFilters = {
  hubId?: string;
  search?: string;
  lowStockOnly?: boolean;
};

export function listInventory(
  filters: InventoryFilters = {},
): Promise<InventoryRow[]> {
  return apiRequest<InventoryRow[]>("/inventory", { query: filters });
}

export type AdjustInventoryInput = {
  hubId: string;
  productId: string;
  stock: number;
  reorderPoint?: number;
  reason?: string;
};

export function adjustInventory(
  input: AdjustInventoryInput,
): Promise<{ ok: true }> {
  return apiRequest<{ ok: true }>("/inventory/adjust", {
    method: "PUT",
    body: input,
  });
}
