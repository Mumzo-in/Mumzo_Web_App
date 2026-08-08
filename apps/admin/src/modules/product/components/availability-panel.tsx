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

  const hubGroups = new Map<
    string,
    { hubName: string; variants: InventoryRow[] }
  >();
  for (const row of rows) {
    const group = hubGroups.get(row.hubId);
    if (group) {
      group.variants.push(row);
    } else {
      hubGroups.set(row.hubId, { hubName: row.hubName, variants: [row] });
    }
  }

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

      {hubGroups.size > 0 ? (
        <div className="flex flex-col gap-2">
          {[...hubGroups.entries()].map(([hubId, group]) => (
            <div
              className="flex items-center justify-between gap-4 rounded-xl border border-border px-3 py-2"
              key={hubId}
            >
              <div className="flex flex-col">
                <span className="font-medium text-sm">{group.hubName}</span>
                <span className="text-[10px] text-muted-foreground">
                  Alert threshold: {group.variants[0]?.reorderPoint}
                </span>
              </div>
              <div className="flex flex-wrap items-center justify-end gap-x-4 gap-y-1">
                {group.variants.map((variant) => (
                  <div className="flex items-center gap-2" key={variant.id}>
                    {variant.variantLabel &&
                    variant.variantLabel !== "Default" ? (
                      <span className="text-muted-foreground text-xs">
                        {variant.variantLabel}:
                      </span>
                    ) : null}
                    {variant.isLowStock ? (
                      <Badge variant="destructive">Low stock</Badge>
                    ) : null}
                    <span className="numeric text-sm">
                      {variant.stock} in stock
                    </span>
                  </div>
                ))}
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
