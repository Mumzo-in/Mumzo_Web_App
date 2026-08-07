import { Badge } from "@mumzo/ui/components/badge";
import { Button } from "@mumzo/ui/components/button";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@mumzo/ui/components/combobox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@mumzo/ui/components/dialog";
import { Field, FieldError, FieldLabel } from "@mumzo/ui/components/field";
import { Input } from "@mumzo/ui/components/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@mumzo/ui/components/popover";
import { cn } from "@mumzo/ui/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Check,
  Loader2,
  Minus,
  Plus,
  Search,
  ShoppingCart,
  Trash2,
  User,
} from "lucide-react";
import { type Dispatch, type SetStateAction, useState } from "react";
import { toast } from "sonner";
import { queryKeys } from "@/core/api/query-keys";
import { formatMoney } from "@/core/components/format";
import { listAllHubs } from "@/modules/product/api/inventory-api";
import { listProducts, type Product } from "@/modules/product/api/products-api";
import { listUsers } from "@/modules/users/api/users-api";
import type { AdminUser } from "@/modules/users/data/user-data";
import {
  type CreateOrderInput,
  type CreateOrderLineInput,
  createOrder,
} from "../api/orders-api";

const STEPS = [
  { id: "location", label: "Location" },
  { id: "customer", label: "Customer" },
  { id: "products", label: "Products" },
  { id: "review", label: "Review" },
] as const;

type StepId = (typeof STEPS)[number]["id"];

type LineItem = CreateOrderLineInput & {
  key: string;
  name: string;
  variantLabel: string | null;
  unitPrice: number;
};

type FormValues = {
  hubId: string;
  customerId: string | null;
  customerName: string;
  customerPhone: string;
  addressLine1: string;
  addressLine2: string;
  addressLandmark: string;
  addressPincode: string;
  addressCity: string;
};

function emptyValues(): FormValues {
  return {
    hubId: "",
    customerId: null,
    customerName: "",
    customerPhone: "",
    addressLine1: "",
    addressLine2: "",
    addressLandmark: "",
    addressPincode: "",
    addressCity: "",
  };
}

function StepIndicator({
  step,
  stepIndex,
  onJump,
}: {
  step: StepId;
  stepIndex: number;
  onJump: (index: number) => void;
}) {
  return (
    <div
      className="flex items-center gap-2"
      data-testid="new-order-step-indicator"
    >
      {STEPS.map((s, index) => {
        const active = s.id === step;
        const done = index < stepIndex;
        return (
          <button
            key={s.id}
            type="button"
            onClick={() => index < stepIndex && onJump(index)}
            disabled={index > stepIndex}
            className={cn(
              "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-colors",
              active && "border-primary bg-primary text-primary-foreground",
              !active && done && "border-border bg-secondary text-foreground",
              !active && !done && "border-border/60 text-muted-foreground",
            )}
          >
            <span
              className={cn(
                "flex size-4 items-center justify-center rounded-full text-[10px]",
                active && "bg-primary-foreground/20",
                !active && done && "bg-sage text-ink",
                !active && !done && "bg-muted",
              )}
            >
              {done ? <Check className="size-3" /> : index + 1}
            </span>
            {s.label}
          </button>
        );
      })}
    </div>
  );
}

function HubStep({
  values,
  setField,
  errors,
}: {
  values: FormValues;
  setField: <K extends keyof FormValues>(key: K, value: FormValues[K]) => void;
  errors: Partial<Record<keyof FormValues, string>>;
}) {
  const { data: hubs, isLoading } = useQuery({
    queryKey: ["hubs", "all"],
    queryFn: listAllHubs,
  });

  return (
    <div className="flex flex-col gap-4">
      <Field data-invalid={Boolean(errors.hubId)}>
        <FieldLabel>Fulfilling hub</FieldLabel>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {isLoading && (
            <span className="text-muted-foreground text-xs">Loading hubs…</span>
          )}
          {hubs
            ?.filter((hub) => hub.isActive)
            .map((hub) => (
              <button
                key={hub.id}
                type="button"
                onClick={() => setField("hubId", hub.id)}
                className={cn(
                  "flex flex-col items-start gap-0.5 rounded-2xl border px-4 py-2.5 text-left transition-colors",
                  values.hubId === hub.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-secondary",
                )}
                data-testid={`new-order-hub-${hub.id}`}
              >
                <span className="font-medium text-sm">{hub.name}</span>
                <span className="text-muted-foreground text-xs">
                  {hub.address}
                </span>
              </button>
            ))}
        </div>
        {errors.hubId && <FieldError>{errors.hubId}</FieldError>}
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field
          data-invalid={Boolean(errors.addressLine1)}
          className="col-span-2"
        >
          <FieldLabel>Address line 1</FieldLabel>
          <Input
            value={values.addressLine1}
            onChange={(e) => setField("addressLine1", e.target.value)}
            placeholder="House / flat, street"
            data-testid="new-order-address-line1"
          />
          {errors.addressLine1 && (
            <FieldError>{errors.addressLine1}</FieldError>
          )}
        </Field>
        <Field className="col-span-2">
          <FieldLabel>Address line 2 (optional)</FieldLabel>
          <Input
            value={values.addressLine2}
            onChange={(e) => setField("addressLine2", e.target.value)}
            placeholder="Apartment, floor"
          />
        </Field>
        <Field>
          <FieldLabel>Landmark (optional)</FieldLabel>
          <Input
            value={values.addressLandmark}
            onChange={(e) => setField("addressLandmark", e.target.value)}
          />
        </Field>
        <Field data-invalid={Boolean(errors.addressCity)}>
          <FieldLabel>City</FieldLabel>
          <Input
            value={values.addressCity}
            onChange={(e) => setField("addressCity", e.target.value)}
            data-testid="new-order-city"
          />
          {errors.addressCity && <FieldError>{errors.addressCity}</FieldError>}
        </Field>
        <Field data-invalid={Boolean(errors.addressPincode)}>
          <FieldLabel>Pincode</FieldLabel>
          <Input
            value={values.addressPincode}
            onChange={(e) => setField("addressPincode", e.target.value)}
            inputMode="numeric"
            data-testid="new-order-pincode"
          />
          {errors.addressPincode && (
            <FieldError>{errors.addressPincode}</FieldError>
          )}
        </Field>
      </div>
    </div>
  );
}

function CustomerStep({
  values,
  setField,
  errors,
}: {
  values: FormValues;
  setField: <K extends keyof FormValues>(key: K, value: FormValues[K]) => void;
  errors: Partial<Record<keyof FormValues, string>>;
}) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  const { data: results, isFetching } = useQuery({
    queryKey: [...queryKeys.users.lists(), search],
    queryFn: () => listUsers({ search: search || undefined, limit: 8 }),
    enabled: search.trim().length > 1,
  });

  function pickCustomer(customer: AdminUser) {
    setField("customerId", customer.id);
    setField("customerName", customer.name);
    setField("customerPhone", customer.phone ?? "");
    setOpen(false);
    setSearch("");
  }

  function clearCustomer() {
    setField("customerId", null);
  }

  return (
    <div className="flex flex-col gap-4">
      <Field>
        <FieldLabel>Find an existing customer (optional)</FieldLabel>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger
            render={
              <Button
                variant="outline"
                className="w-full justify-start gap-2 font-normal"
                data-testid="new-order-customer-search-trigger"
              >
                <Search className="size-4 text-muted-foreground" />
                {values.customerId
                  ? `${values.customerName} · ${values.customerPhone}`
                  : "Search by name or phone…"}
              </Button>
            }
          />
          <PopoverContent align="start" className="w-80 p-0">
            <div className="flex flex-col gap-2 p-2.5">
              <Input
                autoFocus
                placeholder="Name or phone number"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                data-testid="new-order-customer-search-input"
              />
              <div className="flex max-h-64 flex-col gap-1 overflow-y-auto">
                {isFetching && (
                  <span className="px-1 py-2 text-muted-foreground text-xs">
                    Searching…
                  </span>
                )}
                {!isFetching &&
                  search.trim().length > 1 &&
                  (results?.data.length ?? 0) === 0 && (
                    <span className="px-1 py-2 text-muted-foreground text-xs">
                      No customers found — fill in details manually below.
                    </span>
                  )}
                {results?.data.map((customer) => (
                  <button
                    key={customer.id}
                    type="button"
                    onClick={() => pickCustomer(customer)}
                    className="flex flex-col items-start gap-0.5 rounded-xl px-2 py-1.5 text-left text-xs hover:bg-secondary"
                  >
                    <span className="font-medium">{customer.name}</span>
                    <span className="text-muted-foreground">
                      {customer.phone ?? customer.email}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </PopoverContent>
        </Popover>
        {values.customerId && (
          <Badge
            variant="secondary"
            className="w-fit cursor-pointer gap-1"
            onClick={clearCustomer}
          >
            <User className="size-3" /> Linked to account — click to unlink
          </Badge>
        )}
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field data-invalid={Boolean(errors.customerName)}>
          <FieldLabel>Customer name</FieldLabel>
          <Input
            value={values.customerName}
            onChange={(e) => setField("customerName", e.target.value)}
            data-testid="new-order-customer-name"
          />
          {errors.customerName && (
            <FieldError>{errors.customerName}</FieldError>
          )}
        </Field>
        <Field data-invalid={Boolean(errors.customerPhone)}>
          <FieldLabel>Phone number</FieldLabel>
          <Input
            value={values.customerPhone}
            onChange={(e) => setField("customerPhone", e.target.value)}
            inputMode="tel"
            data-testid="new-order-customer-phone"
          />
          {errors.customerPhone && (
            <FieldError>{errors.customerPhone}</FieldError>
          )}
        </Field>
      </div>
    </div>
  );
}

type ProductOption = {
  key: string;
  productId: string;
  productSizeId: string | null;
  label: string;
  variantLabel: string | null;
  sku: string;
  price: number;
};

function flattenProduct(product: Product): ProductOption[] {
  if (product.sizes.length === 0) {
    return [
      {
        key: `${product.id}:`,
        productId: product.id,
        productSizeId: null,
        label: product.name,
        variantLabel: null,
        sku: product.sku,
        price: product.price,
      },
    ];
  }
  return product.sizes.map((size) => ({
    key: `${product.id}:${size.id ?? size.label}`,
    productId: product.id,
    productSizeId: size.id ?? null,
    label: product.name,
    variantLabel: size.label,
    sku: product.sku,
    price: size.price,
  }));
}

function ProductsStep({
  lines,
  setLines,
}: {
  lines: LineItem[];
  setLines: Dispatch<SetStateAction<LineItem[]>>;
}) {
  const [search, setSearch] = useState("");

  const { data: results, isFetching } = useQuery({
    queryKey: [...queryKeys.products.lists(), search],
    queryFn: () => listProducts({ search: search || undefined, limit: 12 }),
    enabled: search.trim().length > 0,
  });

  const options: ProductOption[] = (results?.data ?? []).flatMap(
    flattenProduct,
  );

  function addLine(option: ProductOption) {
    setLines((prev) => {
      const existing = prev.find((l) => l.key === option.key);
      if (existing) {
        return prev.map((l) =>
          l.key === option.key ? { ...l, qty: l.qty + 1 } : l,
        );
      }
      return [
        ...prev,
        {
          key: option.key,
          productId: option.productId,
          productSizeId: option.productSizeId,
          productColorId: null,
          qty: 1,
          name: option.label,
          variantLabel: option.variantLabel,
          unitPrice: option.price,
        },
      ];
    });
    setSearch("");
  }

  function updateQty(key: string, delta: number) {
    setLines((prev) =>
      prev
        .map((l) =>
          l.key === key ? { ...l, qty: Math.max(0, l.qty + delta) } : l,
        )
        .filter((l) => l.qty > 0),
    );
  }

  function removeLine(key: string) {
    setLines((prev) => prev.filter((l) => l.key !== key));
  }

  const total = lines.reduce((sum, l) => sum + l.unitPrice * l.qty, 0);

  return (
    <div className="flex flex-col gap-4">
      <Combobox
        items={options}
        filteredItems={options}
        inputValue={search}
        onInputValueChange={setSearch}
        value={null}
        onValueChange={(option: ProductOption | null) => {
          if (option) addLine(option);
        }}
        itemToStringLabel={(option: ProductOption) => option.label}
        data-testid="new-order-product-combobox"
      >
        <ComboboxInput
          placeholder="Search products by name or SKU…"
          data-testid="new-order-product-search-input"
        />
        <ComboboxContent>
          <ComboboxEmpty>
            {isFetching
              ? "Searching…"
              : search.trim().length === 0
                ? "Start typing to search products."
                : "No products found."}
          </ComboboxEmpty>
          <ComboboxList>
            {(option: ProductOption) => (
              <ComboboxItem key={option.key} value={option}>
                <span className="flex w-full items-center justify-between gap-2">
                  <span className="flex flex-col">
                    <span>
                      {option.label}
                      {option.variantLabel ? ` · ${option.variantLabel}` : ""}
                    </span>
                    <span className="text-muted-foreground">{option.sku}</span>
                  </span>
                  <span className="whitespace-nowrap font-medium">
                    {formatMoney(option.price)}
                  </span>
                </span>
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>

      <div className="flex flex-col gap-2" data-testid="new-order-line-items">
        {lines.length === 0 && (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-border border-dashed py-10 text-center text-muted-foreground text-xs">
            <ShoppingCart className="size-6" />
            No products added yet.
          </div>
        )}
        {lines.map((line) => (
          <div
            key={line.key}
            className="flex items-center justify-between gap-3 rounded-2xl border border-border px-3 py-2.5"
          >
            <div className="flex flex-col">
              <span className="font-medium text-sm">{line.name}</span>
              {line.variantLabel && (
                <span className="text-muted-foreground text-xs">
                  {line.variantLabel}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <Button
                  type="button"
                  variant="outline"
                  size="icon-xs"
                  onClick={() => updateQty(line.key, -1)}
                >
                  <Minus />
                </Button>
                <span className="w-6 text-center text-sm">{line.qty}</span>
                <Button
                  type="button"
                  variant="outline"
                  size="icon-xs"
                  onClick={() => updateQty(line.key, 1)}
                >
                  <Plus />
                </Button>
              </div>
              <span className="w-20 text-right font-medium text-sm">
                {formatMoney(line.unitPrice * line.qty)}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                onClick={() => removeLine(line.key)}
              >
                <Trash2 className="text-destructive" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {lines.length > 0 && (
        <div className="flex items-center justify-between border-border/80 border-t pt-3 text-sm">
          <span className="text-muted-foreground">
            Subtotal ({lines.reduce((n, l) => n + l.qty, 0)} items)
          </span>
          <span className="font-medium">{formatMoney(total)}</span>
        </div>
      )}
    </div>
  );
}

function ReviewStep({
  values,
  lines,
}: {
  values: FormValues;
  lines: LineItem[];
}) {
  const { data: hubs } = useQuery({
    queryKey: ["hubs", "all"],
    queryFn: listAllHubs,
  });
  const hubName = hubs?.find((h) => h.id === values.hubId)?.name ?? "—";
  const total = lines.reduce((sum, l) => sum + l.unitPrice * l.qty, 0);

  return (
    <div className="flex flex-col gap-4 text-sm">
      <div className="rounded-2xl border border-border p-4">
        <p className="text-muted-foreground text-xs">Delivering from</p>
        <p className="font-medium">{hubName}</p>
        <p className="mt-2 text-muted-foreground text-xs">Delivery address</p>
        <p>
          {values.addressLine1}
          {values.addressLine2 ? `, ${values.addressLine2}` : ""}
          {values.addressLandmark ? `, near ${values.addressLandmark}` : ""}
        </p>
        <p>
          {values.addressCity} — {values.addressPincode}
        </p>
      </div>
      <div className="rounded-2xl border border-border p-4">
        <p className="text-muted-foreground text-xs">Customer</p>
        <p className="font-medium">{values.customerName}</p>
        <p>{values.customerPhone}</p>
      </div>
      <div className="rounded-2xl border border-border p-4">
        <p className="mb-2 text-muted-foreground text-xs">
          {lines.length} product{lines.length === 1 ? "" : "s"}
        </p>
        <div className="flex flex-col gap-1.5">
          {lines.map((line) => (
            <div key={line.key} className="flex justify-between text-xs">
              <span>
                {line.name}
                {line.variantLabel ? ` (${line.variantLabel})` : ""} ×{" "}
                {line.qty}
              </span>
              <span>{formatMoney(line.unitPrice * line.qty)}</span>
            </div>
          ))}
        </div>
        <div className="mt-2 flex justify-between border-border/80 border-t pt-2 font-medium">
          <span>Subtotal</span>
          <span>{formatMoney(total)}</span>
        </div>
        <p className="mt-1 text-[11px] text-muted-foreground">
          GST and delivery fee are calculated on submit.
        </p>
      </div>
    </div>
  );
}

export default function NewOrderDialog() {
  const [open, setOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [values, setValues] = useState<FormValues>(emptyValues());
  const [lines, setLines] = useState<LineItem[]>([]);
  const [errors, setErrors] = useState<
    Partial<Record<keyof FormValues, string>>
  >({});
  const queryClient = useQueryClient();
  const step = STEPS[stepIndex]?.id ?? "location";

  function setField<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function reset() {
    setStepIndex(0);
    setValues(emptyValues());
    setLines([]);
    setErrors({});
  }

  const createMutation = useMutation({
    mutationFn: (input: CreateOrderInput) => createOrder(input),
    onSuccess: () => {
      toast.success("Order created.");
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
      setOpen(false);
      reset();
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to create order.",
      );
    },
  });

  function validateStep(): boolean {
    const nextErrors: Partial<Record<keyof FormValues, string>> = {};
    if (step === "location") {
      if (!values.hubId)
        nextErrors.hubId = "Pick which hub fulfills this order.";
      if (!values.addressLine1.trim())
        nextErrors.addressLine1 = "Address is required.";
      if (!values.addressCity.trim())
        nextErrors.addressCity = "City is required.";
      if (!values.addressPincode.trim())
        nextErrors.addressPincode = "Pincode is required.";
    }
    if (step === "customer") {
      if (!values.customerName.trim())
        nextErrors.customerName = "Customer name is required.";
      if (!values.customerPhone.trim())
        nextErrors.customerPhone = "Phone number is required.";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function goNext() {
    if (!validateStep()) return;
    if (step === "products" && lines.length === 0) {
      toast.error("Add at least one product.");
      return;
    }
    setStepIndex((i) => Math.min(i + 1, STEPS.length - 1));
  }

  function goBack() {
    setStepIndex((i) => Math.max(i - 1, 0));
  }

  function handleSubmit() {
    if (lines.length === 0) {
      toast.error("Add at least one product.");
      return;
    }
    createMutation.mutate({
      hubId: values.hubId,
      customerId: values.customerId ?? undefined,
      customerName: values.customerName.trim(),
      customerPhone: values.customerPhone.trim(),
      addressLine1: values.addressLine1.trim(),
      addressLine2: values.addressLine2.trim() || undefined,
      addressLandmark: values.addressLandmark.trim() || undefined,
      addressPincode: values.addressPincode.trim(),
      addressCity: values.addressCity.trim(),
      addressLabel: "Manual order",
      items: lines.map((l) => ({
        productId: l.productId,
        productSizeId: l.productSizeId,
        productColorId: l.productColorId,
        qty: l.qty,
      })),
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger
        render={
          <Button data-testid="new-order-trigger">
            <Plus data-icon /> New order
          </Button>
        }
      />
      <DialogContent className="flex max-h-[85vh] flex-col gap-0 overflow-hidden sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create order</DialogTitle>
        </DialogHeader>

        <div className="border-border/80 border-b px-6 pb-4">
          <StepIndicator
            step={step}
            stepIndex={stepIndex}
            onJump={setStepIndex}
          />
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {step === "location" && (
            <HubStep values={values} setField={setField} errors={errors} />
          )}
          {step === "customer" && (
            <CustomerStep values={values} setField={setField} errors={errors} />
          )}
          {step === "products" && (
            <ProductsStep lines={lines} setLines={setLines} />
          )}
          {step === "review" && <ReviewStep values={values} lines={lines} />}
        </div>

        <DialogFooter className="border-border/80 border-t px-6 py-4">
          {stepIndex > 0 && (
            <Button type="button" variant="outline" onClick={goBack}>
              Back
            </Button>
          )}
          {step !== "review" && (
            <Button type="button" onClick={goNext} data-testid="new-order-next">
              Continue
            </Button>
          )}
          {step === "review" && (
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={createMutation.isPending}
              data-testid="new-order-submit"
            >
              {createMutation.isPending && (
                <Loader2 className="animate-spin" data-icon />
              )}
              Create order
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
