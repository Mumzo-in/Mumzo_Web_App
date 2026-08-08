import { Badge } from "@mumzo/ui/components/badge";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { InventoryRow } from "../api/inventory-api";
import { listProductInventory } from "../api/inventory-api";
import { productQueryOptions } from "../queries/products";
import { UpdateStockDialog } from "./update-stock-dialog";

/** Per-hub availability — a simple read-only list plus the "Update stock" dialog. */
export function AvailabilityPanel({ productId }: { productId?: string }) {
  const queryClient = useQueryClient();

  const { data: product } = useQuery({
    ...productQueryOptions(productId as string),
    enabled: Boolean(productId),
  });

  const { data: inventoryRows, isLoading } = useQuery({
    queryKey: ["products", "inventory", productId],
    queryFn: () => listProductInventory(productId as string),
    enabled: Boolean(productId),
  });

  if (!productId) {
    return (
      <p className="text-muted-foreground text-sm">
        Save the product first — hub stock is set against its saved size
        variants.
      </p>
    );
  }

  if (isLoading || !product) {
    return <p className="text-muted-foreground text-sm">Loading…</p>;
  }

  const rows: InventoryRow[] = inventoryRows ?? [];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-xs">
          Stock per hub for this product.
        </p>
        <UpdateStockDialog
          inventoryRows={rows}
          onApplied={() =>
            queryClient.invalidateQueries({
              queryKey: ["products", "inventory", productId],
            })
          }
          product={product}
        />
      </div>

      {rows.length > 0 ? (
        <div className="flex flex-col gap-2">
          {rows.map((row) => (
            <div
              className="flex items-center justify-between rounded-xl border border-border px-3 py-2"
              key={row.id}
            >
              <div className="flex flex-col">
                <span className="font-medium text-sm">
                  {row.hubName}
                  {row.variantLabel && row.variantLabel !== "Default"
                    ? ` (${row.variantLabel})`
                    : ""}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  Alert threshold: {row.reorderPoint}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {row.isLowStock ? (
                  <Badge variant="destructive">Low stock</Badge>
                ) : null}
                <span className="numeric text-sm">{row.stock} in stock</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground text-sm">
          Not stocked at any hub yet.
        </p>
      )}
    </div>
  );
}
