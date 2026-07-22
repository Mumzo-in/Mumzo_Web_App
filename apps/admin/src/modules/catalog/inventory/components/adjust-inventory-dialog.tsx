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
import { hubsQueryOptions } from "@/modules/catalog/hubs";
import { listProducts } from "@/modules/catalog/products";
import { adjustInventory, type InventoryRow } from "../api/inventory-api";

const schema = z.object({
  hubId: z.string().min(1, "Pick a hub."),
  productId: z.string().min(1, "Pick a product."),
  stock: z.number().int().min(0, "Stock can't be negative."),
  reorderPoint: z.number().int().min(0),
});

const productsForPickerQueryOptions = {
  queryKey: [...queryKeys.products.lists(), "picker"] as const,
  queryFn: () => listProducts({ page: 1, limit: 200 }),
  staleTime: 60_000,
};

/**
 * Sets stock for one hub × product pair. Works for both an existing row
 * (prefilled from `row`) and a hub carrying a product for the first time —
 * the server upserts, so there's no separate "add" endpoint.
 */
export function AdjustInventoryDialog({ row }: { row?: InventoryRow }) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const isEdit = Boolean(row);

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
      productId: row?.productId ?? "",
      stock: row?.stock ?? 0,
      reorderPoint: row?.reorderPoint ?? 12,
    },
    validators: { onSubmit: schema },
    onSubmit: async ({ value }) => {
      await mutation.mutateAsync(value);
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
            Adjust stock
          </>
        )}
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Adjust stock" : "Set stock for a hub"}
          </DialogTitle>
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
          <FieldGroup>
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
                        <SelectValue placeholder="Pick a hub" />
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
                      disabled={isEdit}
                      onValueChange={(value) => field.handleChange(value ?? "")}
                      value={field.state.value}
                    >
                      <SelectTrigger id={field.name}>
                        <SelectValue placeholder="Pick a product" />
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
                <Field>
                  <FieldLabel htmlFor={field.name}>Reorder point</FieldLabel>
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

export default AdjustInventoryDialog;
