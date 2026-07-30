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

export function listInventory(
  filters: InventoryFilters = {},
): Promise<InventoryRow[]> {
  return apiRequest<InventoryRow[]>("/inventory", { query: filters });
}

export type ProductVariantOption = { id: string; label: string };

export type ProductVariants = {
  sizes: ProductVariantOption[];
  colors: ProductVariantOption[];
};

export function getProductVariants(
  productId: string,
): Promise<ProductVariants> {
  return apiRequest<ProductVariants>(
    `/inventory/products/${productId}/variants`,
  );
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

export function adjustInventory(
  input: AdjustInventoryInput,
): Promise<{ ok: true }> {
  return apiRequest<{ ok: true }>("/inventory/adjust", {
    method: "PUT",
    body: input,
  });
}
