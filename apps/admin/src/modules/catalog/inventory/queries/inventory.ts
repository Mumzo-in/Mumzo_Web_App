import { queryOptions } from "@tanstack/react-query";
import { queryKeys } from "@/core/api/query-keys";
import { type InventoryFilters, listInventory } from "../api/inventory-api";

export const inventoryQueryOptions = (filters: InventoryFilters = {}) =>
  queryOptions({
    queryKey: [...queryKeys.inventory.lists(), filters] as const,
    queryFn: () => listInventory(filters),
    staleTime: 30_000,
  });
