import { Button } from "@mumzo/ui/components/button";
import {
  Field,
  FieldDescription,
  FieldLabel,
} from "@mumzo/ui/components/field";
import { Input } from "@mumzo/ui/components/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@mumzo/ui/components/table";
import { Plus, Trash2 } from "lucide-react";
import { emptyVariant, type ProductSizeInput } from "./product-form-schema";

/**
 * Variants are the only source of `product.sku`/`price`/`mrp`/`stock` — the
 * server rolls the product row's own fields up from the primary (first) row
 * here, there's no separate plain field for any of them.
 */
export function VariantsTable({
  values,
  onChange,
}: {
  values: ProductSizeInput[];
  onChange: (next: ProductSizeInput[]) => void;
}) {
  function updateRow(index: number, patch: Partial<ProductSizeInput>) {
    onChange(
      values.map((row, i) => (i === index ? { ...row, ...patch } : row)),
    );
  }

  function addRow() {
    onChange([...values, emptyVariant()]);
  }

  function removeRow(index: number) {
    onChange(values.filter((_, i) => i !== index));
  }

  function numberInput(
    row: ProductSizeInput,
    index: number,
    key: "price" | "mrp" | "stock" | "weightGrams",
    placeholder: string,
  ) {
    return (
      <Input
        aria-label={placeholder}
        data-testid={`admin-product-variant-${key}-${index}`}
        onChange={(event) =>
          updateRow(index, { [key]: Number(event.target.value) || 0 })
        }
        placeholder={placeholder}
        type="number"
        value={row[key] || ""}
      />
    );
  }

  function costPriceInput(row: ProductSizeInput, index: number) {
    return (
      <Input
        aria-label="Buying price"
        data-testid={`admin-product-variant-cost-price-${index}`}
        onChange={(event) =>
          updateRow(index, {
            costPrice:
              event.target.value === "" ? null : Number(event.target.value),
          })
        }
        placeholder="Buying price"
        type="number"
        value={row.costPrice ?? ""}
      />
    );
  }

  function skuInput(row: ProductSizeInput, index: number) {
    return (
      <Input
        aria-label="SKU"
        data-testid={`admin-product-variant-sku-${index}`}
        onChange={(event) => updateRow(index, { sku: event.target.value })}
        placeholder="BW-DIA-NB-60"
        value={row.sku}
      />
    );
  }

  function qtyInput(row: ProductSizeInput, index: number) {
    return (
      <Input
        aria-label="Pack size"
        data-testid={`admin-product-variant-qty-${index}`}
        onChange={(event) => updateRow(index, { qty: event.target.value })}
        placeholder="Pack of 72"
        value={row.qty}
      />
    );
  }

  return (
    <Field>
      <FieldLabel>Stock &amp; pricing</FieldLabel>
      <div className="overflow-x-auto rounded-xl border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Label</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Pack size</TableHead>
              <TableHead>Weight (g)</TableHead>
              <TableHead>Buying price</TableHead>
              <TableHead>Selling price</TableHead>
              <TableHead>MRP</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {values.map((row, index) => (
              <TableRow
                // biome-ignore lint/suspicious/noArrayIndexKey: rows have no stable id until saved
                key={index}
              >
                <TableCell>
                  <Input
                    aria-label="Variant label"
                    className="min-w-32"
                    data-testid={`admin-product-variant-label-${index}`}
                    onChange={(event) =>
                      updateRow(index, { label: event.target.value })
                    }
                    placeholder="Small (2-5kg)…"
                    value={row.label}
                  />
                </TableCell>
                <TableCell className="min-w-32">
                  {skuInput(row, index)}
                </TableCell>
                <TableCell className="min-w-32">
                  {qtyInput(row, index)}
                </TableCell>
                <TableCell className="min-w-24">
                  {numberInput(row, index, "weightGrams", "Weight (g)")}
                </TableCell>
                <TableCell className="min-w-28">
                  {costPriceInput(row, index)}
                </TableCell>
                <TableCell className="min-w-28">
                  {numberInput(row, index, "price", "Selling price")}
                </TableCell>
                <TableCell className="min-w-28">
                  {numberInput(row, index, "mrp", "MRP")}
                </TableCell>
                <TableCell className="min-w-24">
                  {numberInput(row, index, "stock", "Stock")}
                </TableCell>
                <TableCell>
                  <Button
                    data-testid={`admin-product-variant-remove-${index}`}
                    disabled={values.length <= 1}
                    onClick={() => removeRow(index)}
                    size="icon"
                    type="button"
                    variant="outline"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <Button
        className="self-start"
        data-testid="admin-product-variant-add"
        onClick={addRow}
        size="sm"
        type="button"
        variant="outline"
      >
        <Plus data-icon="inline-start" />
        Add a variant
      </Button>
      <FieldDescription>
        Total stock across these rows becomes the product's stock.
      </FieldDescription>
    </Field>
  );
}
