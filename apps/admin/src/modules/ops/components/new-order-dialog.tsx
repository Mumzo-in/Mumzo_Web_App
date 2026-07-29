import type { Product } from "@mumzo/schema";
import { Button } from "@mumzo/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@mumzo/ui/components/dialog";
import { Field, FieldGroup, FieldLabel } from "@mumzo/ui/components/field";
import { Input } from "@mumzo/ui/components/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@mumzo/ui/components/select";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { queryKeys } from "@/core/api/query-keys";
import { formatMoney } from "@/core/components/format";
import { closeDialog, useDialogOpen } from "@/core/store/dialog-store";
import { hubsQueryOptions } from "@/modules/operations/hubs";
import { listProducts } from "@/modules/operations/products";
import { type AdminUser, listUsers } from "@/modules/users";
import { createOrder } from "../api/ops-api";
import {
  type NewOrderInput,
  type NewOrderLineItem,
  newOrderSubtotal,
} from "../data/ops-board-data";

export const NEW_ORDER_DIALOG_ID = "new-order";

const EMPTY_FORM: NewOrderInput = {
  customerId: null,
  customerName: "",
  customerPhone: "",
  hub: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  pincode: "",
  items: [],
  paymentMode: "cod",
};

/**
 * Mounted once (in `ops-board.tsx`), reads its open state from the global
 * dialog store — any trigger anywhere calls `openDialog(NEW_ORDER_DIALOG_ID)`
 * instead of owning its own `useState` + rendering its own dialog tree.
 */
export function NewOrderDialog() {
  const open = useDialogOpen(NEW_ORDER_DIALOG_ID);
  const queryClient = useQueryClient();

  const [form, setForm] = useState<NewOrderInput>(EMPTY_FORM);
  const [customerSearch, setCustomerSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { data: hubs } = useQuery(hubsQueryOptions);

  const { data: customerResults } = useQuery({
    queryKey: queryKeys.users.list({ search: customerSearch }),
    queryFn: () => listUsers({ search: customerSearch || undefined }),
    enabled: customerSearch.trim().length > 1,
  });

  const { data: productResults } = useQuery({
    queryKey: queryKeys.products.list({ search: productSearch }),
    queryFn: () => listProducts({ search: productSearch || undefined }),
    enabled: productSearch.trim().length > 1,
  });

  function reset() {
    setForm(EMPTY_FORM);
    setCustomerSearch("");
    setProductSearch("");
  }

  function handleOpenChange(next: boolean) {
    if (!next) {
      closeDialog();
      reset();
    }
  }

  function selectCustomer(user: AdminUser) {
    setForm((prev) => ({
      ...prev,
      customerId: user.id,
      customerName: user.name,
      customerPhone: user.phone ?? "",
    }));
    setCustomerSearch("");
  }

  function addProduct(product: Product) {
    setForm((prev) => {
      const existing = prev.items.find((item) => item.productId === product.id);
      if (existing) {
        return {
          ...prev,
          items: prev.items.map((item) =>
            item.productId === product.id
              ? { ...item, qty: item.qty + 1 }
              : item,
          ),
        };
      }

      const line: NewOrderLineItem = {
        productId: product.id,
        productName: product.name,
        variantLabel: product.qty,
        qty: 1,
        price: product.price,
      };
      return { ...prev, items: [...prev.items, line] };
    });
    setProductSearch("");
  }

  function updateQty(productId: string, qty: number) {
    setForm((prev) => ({
      ...prev,
      items:
        qty <= 0
          ? prev.items.filter((item) => item.productId !== productId)
          : prev.items.map((item) =>
              item.productId === productId ? { ...item, qty } : item,
            ),
    }));
  }

  function removeItem(productId: string) {
    setForm((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.productId !== productId),
    }));
  }

  const canSubmit =
    form.customerName.trim().length > 0 &&
    form.hub.length > 0 &&
    form.addressLine1.trim().length > 0 &&
    form.pincode.trim().length > 0 &&
    form.items.length > 0;

  async function handleSubmit() {
    if (!canSubmit) {
      return;
    }
    setSubmitting(true);
    try {
      await createOrder(form);
      await queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
      toast.success("Order created.");
      closeDialog();
      reset();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not create order.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  const subtotal = newOrderSubtotal(form.items);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>New order</DialogTitle>
          <DialogDescription>
            Place a manual order on a customer's behalf (phone/COD orders).
          </DialogDescription>
        </DialogHeader>

        <FieldGroup>
          {/* Customer */}
          <Field>
            <FieldLabel>Customer</FieldLabel>
            {form.customerId || form.customerName ? (
              <div className="flex items-center justify-between border border-border px-3 py-2 text-sm">
                <span>
                  {form.customerName}
                  {form.customerPhone ? ` · ${form.customerPhone}` : ""}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setForm((prev) => ({
                      ...prev,
                      customerId: null,
                      customerName: "",
                      customerPhone: "",
                    }))
                  }
                >
                  Change
                </Button>
              </div>
            ) : (
              <div className="relative">
                <Input
                  placeholder="Search name, email or phone…"
                  value={customerSearch}
                  onChange={(event) => setCustomerSearch(event.target.value)}
                  data-testid="new-order-customer-search"
                />
                {customerResults && customerResults.data.length > 0 && (
                  <div className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto border border-border bg-popover shadow-md">
                    {customerResults.data.map((user) => (
                      <button
                        key={user.id}
                        type="button"
                        className="flex w-full flex-col items-start px-3 py-2 text-left text-xs hover:bg-accent"
                        onClick={() => selectCustomer(user)}
                      >
                        <span className="font-medium">{user.name}</span>
                        <span className="text-muted-foreground">
                          {user.phone ?? user.email}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </Field>

          {/* Or new customer inline */}
          {!form.customerId && (
            <div className="grid grid-cols-2 gap-3">
              <Field>
                <FieldLabel>Or new customer — name</FieldLabel>
                <Input
                  value={form.customerName}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      customerName: event.target.value,
                    }))
                  }
                  data-testid="new-order-customer-name"
                />
              </Field>
              <Field>
                <FieldLabel>Phone</FieldLabel>
                <Input
                  value={form.customerPhone}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      customerPhone: event.target.value,
                    }))
                  }
                  data-testid="new-order-customer-phone"
                />
              </Field>
            </div>
          )}

          {/* Hub */}
          <Field>
            <FieldLabel>Hub</FieldLabel>
            <Select
              value={form.hub}
              onValueChange={(value) =>
                setForm((prev) => ({ ...prev, hub: String(value) }))
              }
            >
              <SelectTrigger
                className="border-border bg-card"
                data-testid="new-order-hub"
              >
                <SelectValue placeholder="Select a hub" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {(hubs ?? []).map((hub) => (
                    <SelectItem key={hub.id} value={hub.name}>
                      {hub.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>

          {/* Address */}
          <div className="grid grid-cols-2 gap-3">
            <Field className="col-span-2">
              <FieldLabel>Address line 1</FieldLabel>
              <Input
                value={form.addressLine1}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    addressLine1: event.target.value,
                  }))
                }
                data-testid="new-order-address-1"
              />
            </Field>
            <Field className="col-span-2">
              <FieldLabel>Address line 2</FieldLabel>
              <Input
                value={form.addressLine2}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    addressLine2: event.target.value,
                  }))
                }
              />
            </Field>
            <Field>
              <FieldLabel>City</FieldLabel>
              <Input
                value={form.city}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, city: event.target.value }))
                }
              />
            </Field>
            <Field>
              <FieldLabel>Pincode</FieldLabel>
              <Input
                value={form.pincode}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    pincode: event.target.value,
                  }))
                }
                data-testid="new-order-pincode"
              />
            </Field>
          </div>

          {/* Items */}
          <Field>
            <FieldLabel>Items</FieldLabel>
            <div className="relative">
              <Input
                placeholder="Search products by name or SKU…"
                value={productSearch}
                onChange={(event) => setProductSearch(event.target.value)}
                data-testid="new-order-product-search"
              />
              {productResults && productResults.data.length > 0 && (
                <div className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto border border-border bg-popover shadow-md">
                  {productResults.data.map((product) => (
                    <button
                      key={product.id}
                      type="button"
                      className="flex w-full items-center justify-between px-3 py-2 text-left text-xs hover:bg-accent"
                      onClick={() => addProduct(product)}
                    >
                      <span>{product.name}</span>
                      <span className="numeric text-muted-foreground">
                        {formatMoney(product.price)}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {form.items.length > 0 && (
              <div className="flex flex-col gap-2 border border-border p-2">
                {form.items.map((item) => (
                  <div
                    key={item.productId}
                    className="flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">{item.productName}</span>
                      <span className="text-muted-foreground">
                        {formatMoney(item.price)} · {item.variantLabel}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        className="rounded-none p-1 hover:bg-accent"
                        onClick={() => updateQty(item.productId, item.qty - 1)}
                      >
                        <Minus className="size-3" />
                      </button>
                      <span className="numeric w-6 text-center">
                        {item.qty}
                      </span>
                      <button
                        type="button"
                        className="rounded-none p-1 hover:bg-accent"
                        onClick={() => updateQty(item.productId, item.qty + 1)}
                      >
                        <Plus className="size-3" />
                      </button>
                      <button
                        type="button"
                        className="rounded-none p-1 text-destructive hover:bg-destructive/10"
                        onClick={() => removeItem(item.productId)}
                      >
                        <Trash2 className="size-3" />
                      </button>
                    </div>
                  </div>
                ))}
                <div className="flex justify-between border-border border-t pt-2 font-medium text-xs">
                  <span>Subtotal</span>
                  <span className="numeric">{formatMoney(subtotal)}</span>
                </div>
              </div>
            )}
          </Field>

          {/* Payment mode */}
          <Field>
            <FieldLabel>Payment</FieldLabel>
            <Select
              value={form.paymentMode}
              onValueChange={(value) =>
                setForm((prev) => ({
                  ...prev,
                  paymentMode: value as NewOrderInput["paymentMode"],
                }))
              }
            >
              <SelectTrigger className="border-border bg-card">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="cod">Cash on delivery</SelectItem>
                  <SelectItem value="prepaid">
                    Prepaid (confirmed outside the app)
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>
        </FieldGroup>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit || submitting}
            data-testid="new-order-submit"
          >
            Create order
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default NewOrderDialog;
