import type { ProductSize } from "@mumzo/catalog-model";
import { Button } from "@mumzo/ui/components/button";
import { Input } from "@mumzo/ui/components/input";
import { Label } from "@mumzo/ui/components/label";
import { Plus, Trash2 } from "lucide-react";

/**
 * Repeatable variant rows — label, price, stock. When a product has variants,
 * total stock is their sum (the form derives it), so stock is edited here too.
 */
export function SizeEditor({
  value,
  onChange,
}: {
  value: ProductSize[];
  onChange: (next: ProductSize[]) => void;
}) {
  function update(index: number, patch: Partial<ProductSize>) {
    onChange(
      value.map((size, i) => (i === index ? { ...size, ...patch } : size)),
    );
  }

  function remove(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  function add() {
    onChange([...value, { label: "", price: 0, stock: 0 }]);
  }

  return (
    <div className="flex flex-col gap-3" data-testid="admin-size-editor">
      {value.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          No variants — this product is sold as a single option.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-[1fr_7rem_7rem_auto] gap-2 px-1">
            <Label className="text-muted-foreground text-xs">Label</Label>
            <Label className="text-muted-foreground text-xs">Price ₹</Label>
            <Label className="text-muted-foreground text-xs">Stock</Label>
            <span className="w-9" />
          </div>
          {value.map((size, index) => (
            <div
              // Index-keyed rows are stable here: order is preserved and rows
              // are only appended or removed, never reordered.
              key={`size-${index.toString()}`}
              className="grid grid-cols-[1fr_7rem_7rem_auto] gap-2"
            >
              <Input
                aria-label="Size label"
                value={size.label}
                placeholder="e.g. 240ml"
                onChange={(event) =>
                  update(index, { label: event.target.value })
                }
                data-testid={`admin-size-label-${index}`}
              />
              <Input
                aria-label="Size price"
                type="number"
                inputMode="numeric"
                value={size.price || ""}
                onChange={(event) =>
                  update(index, { price: Number(event.target.value) })
                }
              />
              <Input
                aria-label="Size stock"
                type="number"
                inputMode="numeric"
                value={size.stock || ""}
                onChange={(event) =>
                  update(index, { stock: Number(event.target.value) })
                }
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Remove variant"
                onClick={() => remove(index)}
                data-testid={`admin-size-remove-${index}`}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-fit"
        onClick={add}
        data-testid="admin-size-add"
      >
        <Plus data-icon="inline-start" />
        Add variant
      </Button>
    </div>
  );
}

export default SizeEditor;
