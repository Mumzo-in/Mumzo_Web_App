import {
  BUNDLE_STATUSES,
  type Bundle,
  bundleFormSchema,
  bundleItemsTotal,
  bundleSavings,
  slugify,
} from "@mumzo/schema";
import { Badge } from "@mumzo/ui/components/badge";
import { Button } from "@mumzo/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@mumzo/ui/components/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@mumzo/ui/components/empty";
import { Field, FieldLabel } from "@mumzo/ui/components/field";
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
import { useQuery } from "@tanstack/react-query";
import { Minus, Plus, Search, Trash2 } from "lucide-react";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from "react";
import { toast } from "sonner";
import {
  NumberField,
  TextareaField,
  TextField,
} from "@/core/components/form-fields";
import { formatMoney } from "@/core/components/format";
import { listProducts } from "@/modules/product";
import type { BundleInput } from "../api/bundles-api";

type BundleItemDraft = {
  productId: string;
  productName: string;
  productImage: string | null;
  productPrice: number;
  quantity: number;
};

function emptyValues() {
  return {
    name: "",
    slug: "",
    description: null as string | null,
    price: 0,
    images: [] as string[],
    status: "draft" as (typeof BUNDLE_STATUSES)[number],
  };
}

function valuesFrom(bundle: Bundle) {
  return {
    name: bundle.name,
    slug: bundle.slug,
    description: bundle.description,
    price: bundle.price,
    images: bundle.images,
    status: bundle.status,
  };
}

function itemsFrom(bundle?: Bundle): BundleItemDraft[] {
  if (!bundle) {
    return [];
  }
  return bundle.items.map((item) => ({
    productId: item.productId,
    productName: item.productName,
    productImage: item.productImage,
    productPrice: item.productPrice,
    quantity: item.quantity,
  }));
}

export type BundleFormHandle = {
  submit: () => void;
};

/** Imperative handle so a page can trigger submit from outside the form tree
 * (e.g. a PageHeader action) — same pattern as `VendorForm`/`ProductForm`. */
export const BundleForm = forwardRef<
  BundleFormHandle,
  {
    /** Present for edit; absent for create. */
    bundle?: Bundle;
    /** Prefills one item when arriving from a product's "create bundle"
     * shortcut — `product-form.tsx`'s discovery tab passes this. */
    initialProductId?: string;
    onSubmit: (values: BundleInput) => Promise<void>;
    onPendingChange?: (pending: boolean) => void;
  }
>(function BundleForm(
  { bundle, initialProductId, onSubmit, onPendingChange },
  ref,
) {
  const [pending, setPending] = useState(false);
  const [items, setItems] = useState<BundleItemDraft[]>(() =>
    itemsFrom(bundle),
  );
  const [search, setSearch] = useState("");

  const searchResults = useQuery({
    queryKey: ["products", "list", "bundlePicker", search] as const,
    queryFn: () => listProducts({ search: search || undefined, limit: 8 }),
    enabled: search.trim().length > 0,
  });

  // Prefill the initial product once its details load, if it isn't already
  // in the list (create flow only — `bundle` edits already have their items).
  const prefill = useQuery({
    queryKey: ["products", "detail", "bundlePrefill", initialProductId],
    queryFn: () => listProducts({ search: initialProductId, limit: 1 }),
    enabled: Boolean(initialProductId) && !bundle,
  });

  useEffect(() => {
    if (!initialProductId || bundle) {
      return;
    }
    const match = prefill.data?.data.find((p) => p.id === initialProductId);
    if (match) {
      setItems((current) =>
        current.some((item) => item.productId === match.id)
          ? current
          : [
              ...current,
              {
                productId: match.id,
                productName: match.name,
                productImage: match.images[0] ?? null,
                productPrice: match.price,
                quantity: 1,
              },
            ],
      );
    }
    // Only run once the prefill product resolves.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefill.data, initialProductId, bundle]);

  const form = useForm({
    defaultValues: bundle ? valuesFrom(bundle) : emptyValues(),
    onSubmit: async ({ value }) => {
      const candidate = {
        ...value,
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
      };

      const result = bundleFormSchema.safeParse(candidate);
      if (!result.success) {
        toast.error(result.error.issues[0]?.message ?? "Check the form.");
        return;
      }

      setPending(true);
      try {
        await onSubmit(candidate as BundleInput);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Couldn't save the bundle.",
        );
      } finally {
        setPending(false);
      }
    },
  });

  useEffect(() => {
    onPendingChange?.(pending);
  }, [pending, onPendingChange]);

  useImperativeHandle(ref, () => ({
    submit: () => form.handleSubmit(),
  }));

  const itemsTotal = useMemo(() => bundleItemsTotal(items), [items]);

  function addProduct(product: {
    id: string;
    name: string;
    images: string[];
    price: number;
  }) {
    if (items.some((item) => item.productId === product.id)) {
      toast.error(`${product.name} is already in this bundle.`);
      return;
    }
    setItems((current) => [
      ...current,
      {
        productId: product.id,
        productName: product.name,
        productImage: product.images[0] ?? null,
        productPrice: product.price,
        quantity: 1,
      },
    ]);
    setSearch("");
  }

  function removeItem(productId: string) {
    setItems((current) =>
      current.filter((item) => item.productId !== productId),
    );
  }

  function setQuantity(productId: string, quantity: number) {
    setItems((current) =>
      current.map((item) =>
        item.productId === productId
          ? { ...item, quantity: Math.max(1, quantity) }
          : item,
      ),
    );
  }

  return (
    <form
      data-testid="admin-bundle-form"
      onSubmit={(event) => {
        event.preventDefault();
        event.stopPropagation();
        form.handleSubmit();
      }}
    >
      <div className="flex flex-col gap-4">
        <Card className="shadow-warm">
          <CardHeader>
            <CardTitle>Bundle details</CardTitle>
            <CardDescription>
              A named combo of products sold together at one price.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-5 md:grid-cols-2">
            <form.Field name="name">
              {(field) => (
                <TextField
                  field={field}
                  label="Name"
                  placeholder="Newborn Starter Kit"
                  testId="admin-bundle-name"
                />
              )}
            </form.Field>

            <form.Field name="slug">
              {(field) => (
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <TextField
                      description="Used in the bundle's URL."
                      field={field}
                      label="Slug"
                      placeholder="newborn-starter-kit"
                      testId="admin-bundle-slug"
                    />
                  </div>
                  <Button
                    className="mb-6"
                    onClick={() =>
                      field.handleChange(slugify(form.getFieldValue("name")))
                    }
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    From name
                  </Button>
                </div>
              )}
            </form.Field>

            <form.Field name="price">
              {(field) => (
                <NumberField
                  field={field}
                  label="Bundle price (₹)"
                  testId="admin-bundle-price"
                />
              )}
            </form.Field>

            <form.Field name="status">
              {(field) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>Status</FieldLabel>
                  <Select
                    onValueChange={(value) =>
                      field.handleChange(value as never)
                    }
                    value={field.state.value}
                  >
                    <SelectTrigger
                      data-testid="admin-bundle-status"
                      id={field.name}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {BUNDLE_STATUSES.map((status) => (
                          <SelectItem key={status} value={status}>
                            {status}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </Field>
              )}
            </form.Field>

            <form.Field name="description">
              {(field) => (
                <div className="md:col-span-2">
                  <TextareaField
                    description="Optional. Shown on the bundle's own page."
                    field={field}
                    label="Description"
                  />
                </div>
              )}
            </form.Field>
          </CardContent>
        </Card>

        <Card className="shadow-warm">
          <CardHeader>
            <CardTitle>Products in this bundle</CardTitle>
            <CardDescription>
              Pick 2 or more products and how many of each the combo includes.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="relative">
              <Search
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                data-icon="inline-start"
              />
              <Input
                className="pl-9"
                data-testid="admin-bundle-product-search"
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search products to add…"
                value={search}
              />
              {search.trim().length > 0 ? (
                <div className="absolute z-10 mt-1 max-h-64 w-full overflow-y-auto rounded-2xl border bg-popover shadow-warm">
                  {searchResults.isLoading ? (
                    <div className="p-3 text-muted-foreground text-sm">
                      Searching…
                    </div>
                  ) : (searchResults.data?.data.length ?? 0) === 0 ? (
                    <div className="p-3 text-muted-foreground text-sm">
                      No products found.
                    </div>
                  ) : (
                    (searchResults.data?.data ?? []).map((product) => (
                      <button
                        className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm transition-colors hover:bg-secondary"
                        data-testid={`admin-bundle-product-option-${product.id}`}
                        key={product.id}
                        onClick={() => addProduct(product)}
                        type="button"
                      >
                        <span className="flex flex-col">
                          <span className="font-medium">{product.name}</span>
                          <span className="text-muted-foreground text-xs">
                            {product.sku}
                          </span>
                        </span>
                        <span className="numeric text-muted-foreground text-xs">
                          {formatMoney(product.price)}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              ) : null}
            </div>

            {items.length === 0 ? (
              <Empty>
                <EmptyHeader>
                  <EmptyTitle>No products yet</EmptyTitle>
                  <EmptyDescription>
                    Search above and add at least 2 products.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <div className="flex flex-col gap-2">
                {items.map((item) => (
                  <div
                    className="flex items-center justify-between gap-3 rounded-2xl border p-3"
                    data-testid={`admin-bundle-item-${item.productId}`}
                    key={item.productId}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      {item.productImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          alt={item.productName}
                          className="size-10 shrink-0 rounded-xl object-cover"
                          src={item.productImage}
                        />
                      ) : (
                        <div className="size-10 shrink-0 rounded-xl bg-secondary" />
                      )}
                      <div className="flex min-w-0 flex-col">
                        <span className="truncate font-medium">
                          {item.productName}
                        </span>
                        <span className="numeric text-muted-foreground text-xs">
                          {formatMoney(item.productPrice)} each
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() =>
                          setQuantity(item.productId, item.quantity - 1)
                        }
                        size="icon-xs"
                        type="button"
                        variant="outline"
                      >
                        <Minus data-icon="inline-start" />
                      </Button>
                      <span
                        className="numeric w-6 text-center text-sm"
                        data-testid={`admin-bundle-item-qty-${item.productId}`}
                      >
                        {item.quantity}
                      </span>
                      <Button
                        onClick={() =>
                          setQuantity(item.productId, item.quantity + 1)
                        }
                        size="icon-xs"
                        type="button"
                        variant="outline"
                      >
                        <Plus data-icon="inline-start" />
                      </Button>
                      <Button
                        className="hover:border-destructive/20 hover:bg-destructive/10 hover:text-destructive"
                        data-testid={`admin-bundle-item-remove-${item.productId}`}
                        onClick={() => removeItem(item.productId)}
                        size="icon-xs"
                        type="button"
                        variant="outline"
                      >
                        <Trash2 data-icon="inline-start" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {items.length > 0 ? (
              <form.Subscribe selector={(state) => state.values.price}>
                {(price) => {
                  const bundlePrice = price ?? 0;
                  const savings = bundleSavings({ price: bundlePrice }, items);
                  return (
                    <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-secondary p-4">
                      <Badge variant="secondary">
                        Items total: {formatMoney(itemsTotal)}
                      </Badge>
                      <Badge variant="secondary">
                        Bundle price: {formatMoney(bundlePrice)}
                      </Badge>
                      <Badge
                        className={
                          savings >= 0
                            ? "bg-sage text-ink"
                            : "bg-destructive/10 text-destructive"
                        }
                      >
                        {savings >= 0
                          ? `Customer saves ${formatMoney(savings)}`
                          : `Priced ${formatMoney(Math.abs(savings))} above items`}
                      </Badge>
                    </div>
                  );
                }}
              </form.Subscribe>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </form>
  );
});

export default BundleForm;
