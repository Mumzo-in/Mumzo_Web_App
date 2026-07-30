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
  FieldError,
  FieldGroup,
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
import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PackagePlus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { queryKeys } from "@/core/api/query-keys";
import { hubsQueryOptions } from "@/modules/operations/hubs";
import { listProducts } from "@/modules/operations/products";
import {
  adjustInventory,
  getProductVariants,
  type InventoryRow,
} from "../api/inventory-api";

const NO_VARIANT = "none";

const schema = z.object({
  hubId: z.string().min(1, "Pick a hub."),
  productId: z.string().min(1, "Pick a product."),
  variantKey: z.string().min(1, "Pick a variant."),
  stock: z.number().int().min(0, "Stock can't be negative."),
  reorderPoint: z.number().int().min(0),
});

const productsForPickerQueryOptions = {
  queryKey: [...queryKeys.products.lists(), "picker"] as const,
  queryFn: () => listProducts({ page: 1, limit: 200 }),
  staleTime: 60_000,
};

/** A variant is picked as one `"size:<id>" | "color:<id>" | "none"` value —
 * a product only ever has one variant axis (never both), so a single select
 * covers it without a second control. */
function variantKeyOf(
  row: Pick<InventoryRow, "productSizeId" | "productColorId">,
) {
  if (row.productSizeId) return `size:${row.productSizeId}`;
  if (row.productColorId) return `color:${row.productColorId}`;
  return NO_VARIANT;
}

function parseVariantKey(key: string) {
  if (key === NO_VARIANT) {
    return { productSizeId: null, productColorId: null };
  }
  const [kind, id] = key.split(":");
  return {
    productSizeId: kind === "size" ? id : null,
    productColorId: kind === "color" ? id : null,
  };
}

/**
 * Sets stock for one hub × product × variant. Works for both an existing row
 * (prefilled from `row`) and a hub/variant carrying stock for the first
 * time — the server upserts, so there's no separate "add" endpoint.
 *
 * Deliberately wide (not the default narrow stacked dialog) — hub, variant,
 * stock, and reorder point read as one horizontal form, matching how an
 * operator scans a recount sheet left to right.
 */
export function AdjustInventoryDialog({
  row,
  defaultProductId,
  defaultProductLabel,
}: {
  row?: InventoryRow;
  /** Preselects and locks the product picker — used from a product's own page. */
  defaultProductId?: string;
  /** Shown for `defaultProductId` when it isn't in the picker's first page —
   * the product detail page already knows its own name/SKU, no need to wait
   * on (or widen) the paginated picker query for this one case. */
  defaultProductLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const isEdit = Boolean(row);
  const isProductLocked = isEdit || Boolean(defaultProductId);

  const hubs = useQuery(hubsQueryOptions);
  const products = useQuery(productsForPickerQueryOptions);

  const mutation = useMutation({
    mutationFn: adjustInventory,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.inventory.all,
      });
      toast.success("Stock updated.");
      setOpen(false);
      if (!isEdit) {
        form.reset();
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "Could not update stock.");
    },
  });

  const form = useForm({
    defaultValues: {
      hubId: row?.hubId ?? "",
      productId: row?.productId ?? defaultProductId ?? "",
      variantKey: row ? variantKeyOf(row) : NO_VARIANT,
      stock: row?.stock ?? 0,
      reorderPoint: row?.reorderPoint ?? 12,
    },
    validators: { onSubmit: schema },
    onSubmit: async ({ value }) => {
      await mutation.mutateAsync({
        hubId: value.hubId,
        productId: value.productId,
        stock: value.stock,
        reorderPoint: value.reorderPoint,
        ...parseVariantKey(value.variantKey),
      });
    },
  });

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger
        render={
          isEdit ? (
            <Button size="sm" variant="outline" />
          ) : (
            <Button data-testid="adjust-inventory" />
          )
        }
      >
        {isEdit ? (
          "Adjust"
        ) : (
          <>
            <PackagePlus data-icon="inline-start" />
            Update stock
          </>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Adjust stock" : "Update stock"}</DialogTitle>
          <DialogDescription>
            Sets the count directly — for a manual recount, not a delta.
          </DialogDescription>
        </DialogHeader>

        <form
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            event.stopPropagation();
            form.handleSubmit();
          }}
        >
          <FieldGroup className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <form.Field name="hubId">
              {(field) => {
                const invalid = field.state.meta.errors.length > 0;
                return (
                  <Field data-invalid={invalid || undefined}>
                    <FieldLabel htmlFor={field.name}>Hub</FieldLabel>
                    <Select
                      disabled={isEdit}
                      onValueChange={(value) => field.handleChange(value ?? "")}
                      value={field.state.value}
                    >
                      <SelectTrigger id={field.name}>
                        <SelectValue placeholder="Hub">
                          {(value: string) =>
                            hubs.data?.find((hub) => hub.id === value)?.name ??
                            (value ? value : "Hub")
                          }
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {(hubs.data ?? []).map((hub) => (
                            <SelectItem key={hub.id} value={hub.id}>
                              {hub.name}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    {invalid ? (
                      <FieldError errors={field.state.meta.errors} />
                    ) : null}
                  </Field>
                );
              }}
            </form.Field>

            <form.Field name="productId">
              {(field) => {
                const invalid = field.state.meta.errors.length > 0;
                return (
                  <Field data-invalid={invalid || undefined}>
                    <FieldLabel htmlFor={field.name}>Product</FieldLabel>
                    <Select
                      disabled={isProductLocked}
                      onValueChange={(value) => {
                        field.handleChange(value ?? "");
                        form.setFieldValue("variantKey", NO_VARIANT);
                      }}
                      value={field.state.value}
                    >
                      <SelectTrigger id={field.name}>
                        <SelectValue placeholder="Product">
                          {(value: string) => {
                            const product = products.data?.data.find(
                              (p) => p.id === value,
                            );
                            if (product) {
                              return `${product.name} · ${product.sku}`;
                            }
                            if (
                              value === defaultProductId &&
                              defaultProductLabel
                            ) {
                              return defaultProductLabel;
                            }
                            return value || "Product";
                          }}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {(products.data?.data ?? []).map((product) => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.name} · {product.sku}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    {invalid ? (
                      <FieldError errors={field.state.meta.errors} />
                    ) : null}
                  </Field>
                );
              }}
            </form.Field>

            <form.Subscribe selector={(state) => state.values.productId}>
              {(selectedProductId) => (
                <form.Field name="variantKey">
                  {(field) => {
                    const invalid = field.state.meta.errors.length > 0;
                    return (
                      <VariantField
                        disabled={isEdit}
                        errors={invalid ? field.state.meta.errors : undefined}
                        name={field.name}
                        onChange={field.handleChange}
                        productId={selectedProductId}
                        value={field.state.value}
                      />
                    );
                  }}
                </form.Field>
              )}
            </form.Subscribe>

            <form.Field name="stock">
              {(field) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>Stock on hand</FieldLabel>
                  <Input
                    id={field.name}
                    inputMode="numeric"
                    onBlur={field.handleBlur}
                    onChange={(event) =>
                      field.handleChange(Number(event.target.value) || 0)
                    }
                    type="number"
                    value={field.state.value}
                  />
                </Field>
              )}
            </form.Field>

            <form.Field name="reorderPoint">
              {(field) => (
                <Field className="col-span-2 sm:col-span-4">
                  <FieldLabel htmlFor={field.name}>
                    Low-stock threshold
                  </FieldLabel>
                  <Input
                    className="max-w-40"
                    id={field.name}
                    inputMode="numeric"
                    onBlur={field.handleBlur}
                    onChange={(event) =>
                      field.handleChange(Number(event.target.value) || 0)
                    }
                    type="number"
                    value={field.state.value}
                  />
                  <FieldDescription>
                    Below this, the item shows as low stock.
                  </FieldDescription>
                </Field>
              )}
            </form.Field>
          </FieldGroup>

          <DialogFooter className="mt-2">
            <Button
              disabled={mutation.isPending}
              onClick={() => setOpen(false)}
              type="button"
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              data-testid="submit-inventory-adjust"
              disabled={mutation.isPending}
              type="submit"
            >
              {mutation.isPending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** The variant picker's options depend on the currently selected product, so
 * this owns its own query rather than living inline in the parent — the
 * parent only needs to know the currently selected `productId`. */
function VariantField({
  disabled,
  errors,
  name,
  onChange,
  productId,
  value,
}: {
  disabled: boolean;
  errors?: Array<{ message?: string } | undefined>;
  name: string;
  onChange: (value: string) => void;
  productId: string;
  value: string;
}) {
  const variants = useQuery({
    queryKey: [...queryKeys.inventory.all, "variants", productId] as const,
    queryFn: () => getProductVariants(productId),
    enabled: Boolean(productId),
  });
  const variantOptions = [
    ...(variants.data?.sizes ?? []).map((v) => ({
      key: `size:${v.id}`,
      label: v.label,
    })),
    ...(variants.data?.colors ?? []).map((v) => ({
      key: `color:${v.id}`,
      label: v.label,
    })),
  ];
  const hasVariants = variantOptions.length > 0;

  return (
    <Field data-invalid={errors ? true : undefined}>
      <FieldLabel htmlFor={name}>Variant</FieldLabel>
      <Select
        disabled={disabled || !hasVariants}
        onValueChange={(next) => onChange(next ?? NO_VARIANT)}
        value={value}
      >
        <SelectTrigger id={name}>
          <SelectValue placeholder={hasVariants ? "Variant" : "No variants"}>
            {(v: string) =>
              v === NO_VARIANT
                ? "Whole product"
                : (variantOptions.find((opt) => opt.key === v)?.label ?? v)
            }
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {hasVariants ? (
              variantOptions.map((v) => (
                <SelectItem key={v.key} value={v.key}>
                  {v.label}
                </SelectItem>
              ))
            ) : (
              <SelectItem value={NO_VARIANT}>Whole product</SelectItem>
            )}
          </SelectGroup>
        </SelectContent>
      </Select>
      {errors ? <FieldError errors={errors} /> : null}
    </Field>
  );
}

export default AdjustInventoryDialog;
