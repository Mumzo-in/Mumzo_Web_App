import { Button } from "@mumzo/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@mumzo/ui/components/dialog";
import {
  Field,
  FieldDescription,
  FieldLabel,
} from "@mumzo/ui/components/field";
import { Input } from "@mumzo/ui/components/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@mumzo/ui/components/select";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@mumzo/ui/components/toggle-group";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import type { InventoryRow } from "../api/inventory-api";
import { adjustInventory, listAllHubs } from "../api/inventory-api";
import type { Product } from "../api/products-api";

/**
 * "Update stock" — a dialog with a hub multi-select and one stock number.
 * Fires one `adjustInventory` PUT per selected hub, each setting that hub's
 * stock for the product's size variant to the same value (e.g. entering 100
 * and picking 2 hubs sets both hubs to 100 in stock).
 */
export function UpdateStockDialog({
  product,
  inventoryRows,
  onApplied,
}: {
  product: Product;
  inventoryRows: InventoryRow[];
  onApplied: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [selectedHubIds, setSelectedHubIds] = useState<string[]>([]);
  const [stock, setStock] = useState<number | null>(null);
  const [reorderPoint, setReorderPoint] = useState<number | null>(null);
  const [mode, setMode] = useState<"replace" | "increment" | "decrement">(
    "replace",
  );

  const sizes = product.sizes ?? [];
  const colors = product.colors ?? [];
  const variants = [
    ...sizes.map((s) => ({
      id: s.id ?? null,
      label: s.label,
      type: "size" as const,
    })),
    ...colors.map((c) => ({
      id: c.id ?? null,
      label: c.label,
      type: "color" as const,
    })),
  ];

  const [selectedVariantId, setSelectedVariantId] = useState<string>("");

  const { data: hubs, isLoading: hubsLoading } = useQuery({
    queryKey: ["hubs", "all"],
    queryFn: listAllHubs,
    enabled: open,
  });

  const applyMutation = useMutation({
    mutationFn: async () => {
      if (stock == null || selectedHubIds.length === 0) {
        return;
      }

      const selectedVariant =
        variants.find((v) => v.id === selectedVariantId) ?? variants[0];
      const sizeId =
        selectedVariant?.type === "size" ? selectedVariant.id : null;
      const colorId =
        selectedVariant?.type === "color" ? selectedVariant.id : null;

      await Promise.all(
        selectedHubIds.map((hubId) => {
          const existingRow = inventoryRows.find(
            (row) =>
              row.hubId === hubId &&
              row.productSizeId === sizeId &&
              row.productColorId === colorId,
          );
          const currentStock = existingRow ? existingRow.stock : 0;

          let newStock = stock;
          if (mode === "increment") {
            newStock = currentStock + stock;
          } else if (mode === "decrement") {
            newStock = Math.max(0, currentStock - stock);
          }

          return adjustInventory({
            hubId,
            productId: product.id,
            productSizeId: sizeId,
            productColorId: colorId,
            stock: newStock,
            ...(reorderPoint != null ? { reorderPoint } : {}),
          });
        }),
      );
    },
    onSuccess: () => {
      const modeLabel =
        mode === "replace"
          ? `Set stock to ${stock}`
          : mode === "increment"
            ? `Incremented stock by ${stock}`
            : `Decremented stock by ${stock}`;
      const thresholdLabel =
        reorderPoint != null ? ` with low stock alert <= ${reorderPoint}` : "";
      toast.success(
        `${modeLabel}${thresholdLabel} at ${selectedHubIds.length} hub${selectedHubIds.length === 1 ? "" : "s"}.`,
      );
      setOpen(false);
      setSelectedHubIds([]);
      setStock(null);
      setReorderPoint(null);
      setMode("replace");
      onApplied();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Could not update stock.");
    },
  });

  const hubOptions = (hubs ?? []).filter((hub) => hub.isActive);

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (nextOpen) {
      setSelectedVariantId(variants[0]?.id ?? "");
    }
  }

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogTrigger
        render={
          <Button
            data-testid="admin-product-update-stock-trigger"
            size="sm"
            type="button"
            variant="outline"
          >
            Update stock
          </Button>
        }
      />
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Update stock</DialogTitle>
          <DialogDescription>
            Choose whether to replace, increment, or decrement stock, and select
            the target hubs.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          {variants.length > 1 && (
            <Field>
              <FieldLabel>Variant</FieldLabel>
              <Select
                onValueChange={(value) => setSelectedVariantId(value ?? "")}
                value={selectedVariantId}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select variant…">
                    {(value: string) =>
                      value
                        ? (variants.find((v) => v.id === value)?.label ?? value)
                        : "Select variant…"
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {variants.map((v) => (
                      <SelectItem key={v.id} value={v.id ?? ""}>
                        {v.label || "Default"}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
          )}

          <Field>
            <FieldLabel>Update method</FieldLabel>
            <ToggleGroup
              onValueChange={(value) => {
                const next = value.at(-1);
                if (
                  next === "replace" ||
                  next === "increment" ||
                  next === "decrement"
                ) {
                  setMode(next);
                }
              }}
              value={[mode]}
            >
              <ToggleGroupItem value="replace">Replace</ToggleGroupItem>
              <ToggleGroupItem value="increment">Increment</ToggleGroupItem>
              <ToggleGroupItem value="decrement">Decrement</ToggleGroupItem>
            </ToggleGroup>
          </Field>
          <Field>
            <FieldLabel>Hubs</FieldLabel>
            {hubsLoading ? (
              <p className="text-muted-foreground text-sm">Loading hubs…</p>
            ) : (
              <ToggleGroup
                className="flex-wrap"
                multiple
                onValueChange={setSelectedHubIds}
                value={selectedHubIds}
              >
                {hubOptions.map((hub) => (
                  <ToggleGroupItem
                    data-testid={`admin-product-hub-${hub.id}`}
                    key={hub.id}
                    value={hub.id}
                  >
                    {hub.name}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            )}
          </Field>
          <Field>
            <FieldLabel>Stock</FieldLabel>
            <Input
              data-testid="admin-product-update-stock-input"
              onChange={(event) =>
                setStock(
                  event.target.value === "" ? null : Number(event.target.value),
                )
              }
              placeholder="100"
              type="number"
              value={stock ?? ""}
            />
          </Field>
          <Field>
            <FieldLabel>Low stock alert threshold (Optional)</FieldLabel>
            <Input
              data-testid="admin-product-update-reorder-input"
              onChange={(event) =>
                setReorderPoint(
                  event.target.value === "" ? null : Number(event.target.value),
                )
              }
              placeholder="12 (default)"
              type="number"
              value={reorderPoint ?? ""}
            />
            <FieldDescription>
              Sets the threshold below which this hub triggers a "Low stock"
              alert.
            </FieldDescription>
          </Field>
        </div>
        <DialogFooter>
          <Button
            data-testid="admin-product-update-stock-apply"
            disabled={
              applyMutation.isPending ||
              stock == null ||
              selectedHubIds.length === 0
            }
            onClick={() => applyMutation.mutate()}
            type="button"
          >
            {applyMutation.isPending ? "Applying…" : "Apply"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
