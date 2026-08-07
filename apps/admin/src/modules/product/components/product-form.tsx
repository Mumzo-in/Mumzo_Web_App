import {
  AGE_GROUPS,
  CATEGORY_SLUGS,
  type CategorySlug,
  discountPct,
  marginPct,
  PRODUCT_STATUSES,
  type ProductStatus,
} from "@mumzo/schema";
import { Badge } from "@mumzo/ui/components/badge";
import { Button } from "@mumzo/ui/components/button";
import { Card, CardContent } from "@mumzo/ui/components/card";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@mumzo/ui/components/popover";
import { RichTextEditor } from "@mumzo/ui/components/rich-text-editor";
import { Switch } from "@mumzo/ui/components/switch";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@mumzo/ui/components/toggle-group";
import { cn } from "@mumzo/ui/lib/utils";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, RotateCw, Settings2, Trash2, Upload, X } from "lucide-react";
import {
  forwardRef,
  type KeyboardEvent,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import { ApiError, apiUpload } from "@/core/api/client";
import {
  NumberField,
  SelectField,
  TextField,
} from "@/core/components/form-fields";
import { formatMoney } from "@/core/components/format";
import { listAllBrands } from "@/modules/brand";
import { listAllVendors } from "@/modules/vendor";
import type { InventoryRow } from "../api/inventory-api";
import {
  adjustInventory,
  listAllHubs,
  listProductInventory,
} from "../api/inventory-api";
import { productQueryOptions } from "../queries/products";

const MAX_IMAGES = 10;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

/** "Baby Bath & Skin" → "baby-bath-skin" — mirrors the category form's slugify. */
function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Section-wise sidebar, mirroring the category form's nav pattern. */
const SECTIONS = [
  { id: "basic", label: "Basic", description: "Name, brand and category." },
  { id: "images", label: "Images", description: "Gallery photos, up to 10." },
  {
    id: "stock",
    label: "Stock",
    description: "Vendor, buying price and hub availability.",
  },
  {
    id: "pricing",
    label: "Pricing",
    description: "Selling price and MRP.",
  },
  {
    id: "attributes",
    label: "Attributes",
    description: "Category, age groups and tags.",
  },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

export type ProductSizeInput = {
  id?: string;
  label: string;
  price: number;
  stock: number;
};

export type ProductFormValues = {
  name: string;
  sku: string;
  slug: string;
  brandId: string;
  categorySlug: CategorySlug | "";
  type: string;
  description: string;
  about: string;
  qty: string;
  weight: string;
  countryOfOrigin: string;
  /** Selling price — what the customer pays. */
  price: number | null;
  mrp: number | null;
  /** Buying/cost price from the vendor — drives margin. */
  costPrice: number | null;
  vendorId: string;
  images: string[];
  /** Draft upload session shared by every gallery slot this submit — finalized
   * server-side into permanent keys once the product id is known. */
  uploadSessionId: string | null;
  /** Sizes/variants — the only source of `product.stock`; the server rolls
   * total stock up from these, there's no separate plain stock field. */
  sizes: ProductSizeInput[];
  ages: string[];
  highlights: string[];
  tags: string[];
  status: ProductStatus;
  isBestseller: boolean;
};

function emptyValues(): ProductFormValues {
  return {
    name: "",
    sku: "",
    slug: "",
    brandId: "",
    categorySlug: "",
    type: "",
    description: "",
    about: "",
    qty: "",
    weight: "",
    countryOfOrigin: "India",
    price: null,
    mrp: null,
    costPrice: null,
    vendorId: "",
    images: [],
    uploadSessionId: null,
    sizes: [{ label: "", price: 0, stock: 0 }],
    ages: [],
    highlights: [],
    tags: [],
    status: "draft",
    isBestseller: false,
  };
}

/** Free-form chip list: type + Enter to add, click × to remove. */
function TagListField({
  label,
  description,
  placeholder,
  values,
  onChange,
  testId,
}: {
  label: string;
  description?: string;
  placeholder?: string;
  values: string[];
  onChange: (next: string[]) => void;
  testId?: string;
}) {
  const [draft, setDraft] = useState("");

  function commit() {
    const value = draft.trim();
    if (value && !values.includes(value)) {
      onChange([...values, value]);
    }
    setDraft("");
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      commit();
    } else if (event.key === "Backspace" && draft === "" && values.length > 0) {
      onChange(values.slice(0, -1));
    }
  }

  return (
    <Field>
      <FieldLabel>{label}</FieldLabel>
      <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-border bg-background p-2">
        {values.map((value) => (
          <Badge key={value} variant="secondary">
            {value}
            <button
              aria-label={`Remove ${value}`}
              className="ml-0.5"
              onClick={() => onChange(values.filter((v) => v !== value))}
              type="button"
            >
              <X data-icon="inline-end" />
            </button>
          </Badge>
        ))}
        <input
          className="min-w-24 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          data-testid={testId}
          onBlur={commit}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={values.length === 0 ? placeholder : ""}
          value={draft}
        />
      </div>
      {description ? (
        <p className="text-muted-foreground text-xs">{description}</p>
      ) : null}
    </Field>
  );
}

/** One in-flight upload for a picked file, keyed by a unique slot so
 * multiple files selected at once can upload independently. */
type PendingUpload = {
  key: string;
  file: File;
  status: "uploading" | "error";
  error?: string;
};

async function uploadGalleryFile(
  file: File,
  slot: string,
  sessionId: string | null,
): Promise<{ url: string; sessionId: string }> {
  const formData = new FormData();
  formData.set("file", file);
  formData.set("entity", "products");
  formData.set("slot", slot);
  if (sessionId) {
    formData.set("sessionId", sessionId);
  }
  const data = await apiUpload<{ url: string; sessionId: string }>(
    "/uploads",
    formData,
  );
  return data;
}

/** Multi-file gallery uploader — every file picked in one go uploads to its
 * own slot but shares one `sessionId`, so the server can finalize the whole
 * gallery in a single copy pass keyed by the eventual product id. */
function GalleryUploadTile({
  startIndex,
  sessionId,
  onUploaded,
}: {
  startIndex: number;
  sessionId: string | null;
  onUploaded: (url: string, sessionId: string) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<PendingUpload[]>([]);
  const nextIndex = useRef(startIndex);

  async function uploadOne(
    pendingUpload: PendingUpload,
    slot: string,
    forSessionId: string | null,
  ) {
    try {
      const result = await uploadGalleryFile(
        pendingUpload.file,
        slot,
        forSessionId,
      );
      setPending((prev) => prev.filter((p) => p.key !== pendingUpload.key));
      onUploaded(result.url, result.sessionId);
      return result.sessionId;
    } catch (cause) {
      const message =
        cause instanceof ApiError ? cause.message : "Upload failed.";
      setPending((prev) =>
        prev.map((p) =>
          p.key === pendingUpload.key
            ? { ...p, status: "error", error: message }
            : p,
        ),
      );
      return undefined;
    }
  }

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) {
      return;
    }
    const accepted: PendingUpload[] = [];
    for (const file of Array.from(files)) {
      if (file.size > MAX_IMAGE_BYTES) {
        toast.error(`${file.name} is over 5MB and was skipped.`);
        continue;
      }
      accepted.push({
        key: `${Date.now()}-${file.name}-${Math.random()}`,
        file,
        status: "uploading",
      });
    }
    if (accepted.length === 0) {
      return;
    }
    setPending((prev) => [...prev, ...accepted]);

    // First upload resolves the shared session (when none exists yet) —
    // every other upload in this batch must wait for it, or each would mint
    // its own tmp session and the gallery would never finalize as one unit.
    const [first, ...rest] = accepted;
    if (!first) {
      return;
    }
    const firstSlot = `gallery-${nextIndex.current}`;
    nextIndex.current += 1;
    const resolvedSessionId =
      (await uploadOne(first, firstSlot, sessionId)) ?? sessionId;

    for (const pendingUpload of rest) {
      const slot = `gallery-${nextIndex.current}`;
      nextIndex.current += 1;
      uploadOne(pendingUpload, slot, resolvedSessionId);
    }
  }

  return (
    <>
      <input
        accept="image/*"
        className="hidden"
        multiple
        onChange={(event) => {
          handleFiles(event.target.files);
          event.target.value = "";
        }}
        ref={fileInputRef}
        type="file"
      />
      <button
        className="grid size-24 place-items-center rounded-2xl border border-border border-dashed text-muted-foreground hover:bg-secondary"
        data-testid="admin-product-image-upload-trigger"
        onClick={() => fileInputRef.current?.click()}
        type="button"
      >
        <Upload className="size-5" />
      </button>
      {pending.map((p) => (
        <div className="relative" key={p.key}>
          <div className="grid size-24 place-items-center rounded-2xl border border-border text-muted-foreground">
            {p.status === "uploading" ? (
              <RotateCw className="size-5 animate-spin" />
            ) : (
              <span className="px-2 text-center text-destructive text-xs">
                {p.error ?? "Failed"}
              </span>
            )}
          </div>
          {p.status === "error" ? (
            <button
              aria-label={`Remove ${p.file.name}`}
              className="absolute -top-2 -right-2 grid size-6 place-items-center rounded-full border border-border bg-card shadow-warm"
              onClick={() =>
                setPending((prev) => prev.filter((row) => row.key !== p.key))
              }
              type="button"
            >
              <X className="size-3.5" />
            </button>
          ) : null}
        </div>
      ))}
    </>
  );
}

export const DEFAULT_SIZE_LABEL = "Default";

/** Fills a blank label with "Default" (the single-row, no-real-variants
 * case) before submit — the server requires a non-empty label per row. */
export function normalizeSizes(sizes: ProductSizeInput[]): ProductSizeInput[] {
  return sizes.map((size) => ({
    ...size,
    label: size.label.trim() || DEFAULT_SIZE_LABEL,
  }));
}

/**
 * Sizes are the only thing that gives a product stock — the server derives
 * `product.stock` purely from `sum(sizes[].stock)`, there's no plain stock
 * column. Most products don't really have size variants, so this defaults to
 * a single unlabeled row (submitted as "Default") and only shows price/stock
 * — labels only appear once a second row is added for real variants.
 */
function SizesEditor({
  values,
  onChange,
}: {
  values: ProductSizeInput[];
  onChange: (next: ProductSizeInput[]) => void;
}) {
  const hasVariants = values.length > 1;

  function updateRow(index: number, patch: Partial<ProductSizeInput>) {
    onChange(
      values.map((row, i) => (i === index ? { ...row, ...patch } : row)),
    );
  }

  function addRow() {
    onChange([...values, { label: "", price: 0, stock: 0 }]);
  }

  function removeRow(index: number) {
    onChange(values.filter((_, i) => i !== index));
  }

  return (
    <Field>
      <FieldLabel>Sizes / variants</FieldLabel>
      <div className="flex flex-col gap-2">
        {values.map((row, index) => (
          <div
            className="flex items-end gap-2"
            // biome-ignore lint/suspicious/noArrayIndexKey: rows have no stable id until saved
            key={index}
          >
            {hasVariants ? (
              <div className="flex-1">
                <Input
                  aria-label="Size label"
                  data-testid={`admin-product-size-label-${index}`}
                  onChange={(event) =>
                    updateRow(index, { label: event.target.value })
                  }
                  placeholder="Small (2-5kg)…"
                  value={row.label}
                />
              </div>
            ) : null}
            <div className="w-28">
              <Input
                aria-label="Price"
                data-testid={`admin-product-size-price-${index}`}
                onChange={(event) =>
                  updateRow(index, { price: Number(event.target.value) || 0 })
                }
                placeholder="Price"
                type="number"
                value={row.price || ""}
              />
            </div>
            <div className="w-28">
              <Input
                aria-label="Stock"
                data-testid={`admin-product-size-stock-${index}`}
                onChange={(event) =>
                  updateRow(index, { stock: Number(event.target.value) || 0 })
                }
                placeholder="Stock"
                type="number"
                value={row.stock || ""}
              />
            </div>
            {hasVariants ? (
              <Button
                data-testid={`admin-product-size-remove-${index}`}
                onClick={() => removeRow(index)}
                size="icon"
                type="button"
                variant="outline"
              >
                <Trash2 className="size-3.5" />
              </Button>
            ) : null}
          </div>
        ))}
        <Button
          className="self-start"
          data-testid="admin-product-size-add"
          onClick={addRow}
          size="sm"
          type="button"
          variant="outline"
        >
          <Plus data-icon="inline-start" />
          Add a size variant
        </Button>
      </div>
      <FieldDescription>
        {hasVariants
          ? "Total stock across these rows becomes the product's stock."
          : `No real size variants? Leave it as one row — it's saved as "${DEFAULT_SIZE_LABEL}". Just fill in price and stock.`}
      </FieldDescription>
    </Field>
  );
}
/**
 * "Update stock" — a dialog with a hub multi-select and one stock number.
 * Fires one `adjustInventory` PUT per selected hub, each setting that hub's
 * stock for the product's size variant to the same value (e.g. entering 100
 * and picking 2 hubs sets both hubs to 100 in stock).
 */
function UpdateStockDialog({
  productId,
  sizeId,
  inventoryRows,
  onApplied,
}: {
  productId: string;
  sizeId: string | null;
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
      await Promise.all(
        selectedHubIds.map((hubId) => {
          const existingRow = inventoryRows.find(
            (row) => row.hubId === hubId && row.productSizeId === sizeId,
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
            productId,
            productSizeId: sizeId,
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

  return (
    <Dialog onOpenChange={setOpen} open={open}>
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

/** Per-hub availability — a simple read-only list plus the "Update stock" dialog. */
function AvailabilityPanel({ productId }: { productId?: string }) {
  const queryClient = useQueryClient();

  // Always resolve the size id from the *saved* product, not the live form
  // state — the form's `sizes` field drifts from what's actually persisted
  // as soon as the operator edits it without saving (or on a freshly
  // created product before its first refetch), and using it here previously
  // sent two different `productSizeId` values across separate "Update
  // stock" calls, each creating its own inventory row per hub — the
  // "duplicate hub" bug.
  const { data: product } = useQuery({
    ...productQueryOptions(productId as string),
    enabled: Boolean(productId),
  });

  const savedSizes = (product?.sizes ?? []).filter((size) => size.id);
  const soleSizeId =
    savedSizes.length === 1 &&
    savedSizes[0]?.label !== "Default" &&
    savedSizes[0]?.label !== ""
      ? (savedSizes[0]?.id ?? null)
      : null;

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
          productId={productId}
          sizeId={soleSizeId}
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
                <span className="font-medium text-sm">{row.hubName}</span>
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
      ) : isLoading ? (
        <p className="text-muted-foreground text-sm">Loading…</p>
      ) : (
        <p className="text-muted-foreground text-sm">
          Not stocked at any hub yet.
        </p>
      )}
    </div>
  );
}

export type ProductFormHandle = {
  submit: () => void;
};

export const ProductForm = forwardRef<
  ProductFormHandle,
  {
    initialValues?: ProductFormValues;
    /** Present when editing — enables the Availability tab's inventory lookup. */
    productId?: string;
    onSubmit: (values: ProductFormValues) => Promise<void>;
    onPendingChange?: (pending: boolean) => void;
  }
>(function ProductForm(
  { initialValues, productId, onSubmit, onPendingChange },
  ref,
) {
  const [activeSection, setActiveSection] = useState<SectionId>("basic");
  const isEdit = Boolean(initialValues);
  // Once the operator edits the slug by hand, stop overwriting it from name.
  const slugTouched = useRef(isEdit);

  const { data: vendors } = useQuery({
    queryKey: ["vendors", "all"],
    queryFn: listAllVendors,
  });

  const { data: brands } = useQuery({
    queryKey: ["brands", "all"],
    queryFn: listAllBrands,
  });

  const form = useForm({
    defaultValues: initialValues ?? emptyValues(),
    onSubmit: async ({ value }) => {
      onPendingChange?.(true);
      try {
        await onSubmit(value);
      } finally {
        onPendingChange?.(false);
      }
    },
  });

  useImperativeHandle(ref, () => ({
    submit: () => form.handleSubmit(),
  }));

  return (
    <form
      data-testid="admin-product-form"
      onSubmit={(event) => {
        event.preventDefault();
        event.stopPropagation();
        form.handleSubmit();
      }}
    >
      <div className="grid gap-5 md:grid-cols-[240px_1fr]">
        <nav
          aria-label="Product form sections"
          className="flex h-fit flex-col gap-1 rounded-2xl border border-border bg-card p-2 shadow-warm"
          data-testid="admin-product-form-nav"
        >
          {SECTIONS.map((section) => (
            <button
              className={cn(
                "flex flex-col gap-0.5 rounded-xl px-4 py-3 text-left transition-colors",
                activeSection === section.id
                  ? "bg-primary/10 text-primary"
                  : "text-foreground hover:bg-secondary",
              )}
              data-testid={`admin-product-section-${section.id}`}
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              type="button"
            >
              <span className="font-semibold text-sm">{section.label}</span>
              <span className="text-muted-foreground text-xs">
                {section.description}
              </span>
            </button>
          ))}
        </nav>

        <Card className="shadow-warm">
          <CardContent className="grid gap-5 pt-6 md:grid-cols-2">
            {activeSection === "basic" ? (
              <>
                <form.Field
                  listeners={{
                    onChange: ({ value }) => {
                      if (!slugTouched.current) {
                        form.setFieldValue("slug", slugify(value));
                      }
                    },
                  }}
                  name="name"
                >
                  {(field) => (
                    <TextField
                      field={field}
                      label="Name"
                      placeholder="Newborn Diapers, Ultra Soft"
                      testId="admin-product-name"
                    />
                  )}
                </form.Field>

                <form.Field
                  listeners={{
                    onChange: () => {
                      slugTouched.current = true;
                    },
                  }}
                  name="slug"
                >
                  {(field) => (
                    <TextField
                      description="Used in the storefront URL. Auto-fills from the name until you edit it."
                      field={field}
                      label="Slug"
                      placeholder="babywhiz-newborn-diapers-pack-of-60"
                      testId="admin-product-slug"
                    />
                  )}
                </form.Field>

                <form.Field name="brandId">
                  {(field) => (
                    <SelectField
                      field={field}
                      label="Brand"
                      options={(brands ?? []).map((brand) => ({
                        value: brand.id,
                        label: brand.name,
                      }))}
                      testId="admin-product-brand"
                    />
                  )}
                </form.Field>

                <form.Field name="description">
                  {(field) => (
                    <div className="md:col-span-2">
                      <Field>
                        <FieldLabel>Description</FieldLabel>
                        <RichTextEditor
                          onChange={field.handleChange}
                          placeholder="What is this product, in a sentence or two?"
                          testId="admin-product-description"
                          value={field.state.value}
                        />
                      </Field>
                    </div>
                  )}
                </form.Field>

                <form.Field name="about">
                  {(field) => (
                    <div className="md:col-span-2">
                      <Field>
                        <FieldLabel>About</FieldLabel>
                        <RichTextEditor
                          onChange={field.handleChange}
                          placeholder="Longer detail — ingredients, materials, care…"
                          testId="admin-product-about"
                          value={field.state.value}
                        />
                      </Field>
                    </div>
                  )}
                </form.Field>
              </>
            ) : null}

            {activeSection === "images" ? (
              <div className="md:col-span-2">
                <form.Field name="images">
                  {(imagesField) => {
                    const images: string[] = imagesField.state.value ?? [];
                    return (
                      <form.Field name="uploadSessionId">
                        {(sessionField) => (
                          <Field>
                            <FieldLabel>Gallery</FieldLabel>
                            <div className="flex flex-wrap gap-3">
                              {images.map((url) => (
                                <div className="relative" key={url}>
                                  <img
                                    alt=""
                                    className="size-24 rounded-2xl border object-cover"
                                    src={url}
                                  />
                                  <button
                                    aria-label="Remove image"
                                    className="absolute -top-2 -right-2 grid size-6 place-items-center rounded-full border border-border bg-card shadow-warm"
                                    onClick={() =>
                                      imagesField.handleChange(
                                        images.filter((image) => image !== url),
                                      )
                                    }
                                    type="button"
                                  >
                                    <X className="size-3.5" />
                                  </button>
                                </div>
                              ))}
                              {images.length < MAX_IMAGES ? (
                                <GalleryUploadTile
                                  onUploaded={(url, sessionId) => {
                                    imagesField.handleChange((prev) => [
                                      ...(prev ?? []),
                                      url,
                                    ]);
                                    sessionField.handleChange(sessionId);
                                  }}
                                  sessionId={sessionField.state.value}
                                  startIndex={images.length}
                                />
                              ) : null}
                            </div>
                            <FieldDescription>
                              First image is the primary. Up to {MAX_IMAGES}{" "}
                              images, 5MB max each. {images.length}/{MAX_IMAGES}{" "}
                              used.
                            </FieldDescription>
                          </Field>
                        )}
                      </form.Field>
                    );
                  }}
                </form.Field>
              </div>
            ) : null}

            {activeSection === "stock" ? (
              <>
                <form.Field name="sku">
                  {(field) => (
                    <TextField
                      description="Internal stock-keeping code."
                      field={field}
                      label="SKU"
                      placeholder="BW-DIA-NB-60"
                      testId="admin-product-sku"
                    />
                  )}
                </form.Field>

                <form.Field name="qty">
                  {(field) => (
                    <TextField
                      description="Free text — Pack of 72, 300 g."
                      field={field}
                      label="Pack size"
                      testId="admin-product-qty"
                    />
                  )}
                </form.Field>

                <form.Field name="weight">
                  {(field) => (
                    <TextField
                      field={field}
                      label="Weight"
                      testId="admin-product-weight"
                    />
                  )}
                </form.Field>

                <form.Field name="countryOfOrigin">
                  {(field) => (
                    <TextField
                      field={field}
                      label="Country of origin"
                      testId="admin-product-origin"
                    />
                  )}
                </form.Field>

                <form.Field name="vendorId">
                  {(field) => (
                    <SelectField
                      description="Who this stock is sourced from — optional for self-stocked items."
                      field={field}
                      label="Vendor"
                      options={(vendors ?? []).map((vendor) => ({
                        value: vendor.id,
                        label: vendor.name,
                      }))}
                      placeholder="Self-stocked"
                      testId="admin-product-vendor"
                    />
                  )}
                </form.Field>

                <form.Field name="costPrice">
                  {(field) => (
                    <NumberField
                      description="What we pay the vendor. Whole rupees."
                      field={field}
                      label="Buying price"
                      testId="admin-product-cost-price"
                    />
                  )}
                </form.Field>

                <form.Field name="sizes">
                  {(field) => (
                    <div className="md:col-span-2">
                      <SizesEditor
                        onChange={field.handleChange}
                        values={field.state.value ?? []}
                      />
                    </div>
                  )}
                </form.Field>

                <div className="md:col-span-2">
                  <FieldLabel>Hub availability</FieldLabel>
                  <div className="mt-2">
                    <AvailabilityPanel productId={productId} />
                  </div>
                </div>
              </>
            ) : null}

            {activeSection === "pricing" ? (
              <>
                <form.Field name="costPrice">
                  {(field) => (
                    <NumberField
                      description="What we pay the vendor. Whole rupees."
                      field={field}
                      label="Buying price"
                      testId="admin-product-pricing-cost-price"
                    />
                  )}
                </form.Field>

                <form.Field name="price">
                  {(field) => (
                    <NumberField
                      description="What the customer pays. Whole rupees."
                      field={field}
                      label="Selling price"
                      testId="admin-product-price"
                    />
                  )}
                </form.Field>

                <form.Field name="mrp">
                  {(field) => (
                    <NumberField
                      description="Printed MRP. Whole rupees."
                      field={field}
                      label="MRP"
                      testId="admin-product-mrp"
                    />
                  )}
                </form.Field>

                <form.Subscribe
                  selector={(state) => [
                    state.values.price,
                    state.values.mrp,
                    state.values.costPrice,
                  ]}
                >
                  {([price, mrp, costPrice]) => {
                    const discount =
                      price && mrp ? discountPct({ price, mrp }) : null;
                    const margin =
                      price && costPrice
                        ? marginPct({ price, vendor: { costPrice } })
                        : null;
                    return (
                      <div className="flex gap-6 rounded-xl border border-border bg-secondary/40 px-4 py-3 md:col-span-2">
                        <div className="flex flex-col">
                          <span className="text-muted-foreground text-xs">
                            Discount off MRP
                          </span>
                          <span className="font-semibold text-sm">
                            {discount !== null ? `${discount}%` : "—"}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-muted-foreground text-xs">
                            Margin over cost
                          </span>
                          <span className="font-semibold text-sm">
                            {margin !== null ? `${margin}%` : "—"}
                          </span>
                        </div>
                        {price ? (
                          <div className="flex flex-col">
                            <span className="text-muted-foreground text-xs">
                              Customer pays
                            </span>
                            <span className="font-semibold text-sm">
                              {formatMoney(price)}
                            </span>
                          </div>
                        ) : null}
                      </div>
                    );
                  }}
                </form.Subscribe>
              </>
            ) : null}

            {activeSection === "attributes" ? (
              <>
                <form.Field name="categorySlug">
                  {(field) => (
                    <SelectField
                      field={field}
                      label="Category"
                      options={CATEGORY_SLUGS.map((slug) => ({
                        value: slug,
                        label: slug,
                      }))}
                      testId="admin-product-category"
                    />
                  )}
                </form.Field>

                <form.Field name="type">
                  {(field) => (
                    <TextField
                      description="Sub-type within the category — Wipes, Formula…"
                      field={field}
                      label="Type"
                      testId="admin-product-type"
                    />
                  )}
                </form.Field>

                <form.Field name="ages">
                  {(field) => {
                    const selected: string[] = field.state.value ?? [];
                    return (
                      <div className="md:col-span-2">
                        <Field>
                          <FieldLabel>Age groups</FieldLabel>
                          <ToggleGroup
                            className="flex-wrap"
                            multiple
                            onValueChange={(value) => field.handleChange(value)}
                            value={selected}
                          >
                            {AGE_GROUPS.map((group) => (
                              <ToggleGroupItem
                                key={group.key}
                                value={group.key}
                              >
                                {group.label}
                              </ToggleGroupItem>
                            ))}
                          </ToggleGroup>
                        </Field>
                      </div>
                    );
                  }}
                </form.Field>

                <form.Field name="highlights">
                  {(field) => (
                    <div className="md:col-span-2">
                      <TagListField
                        description="Short bullet points shown on the PDP."
                        label="Highlights"
                        onChange={field.handleChange}
                        placeholder="12-hour dryness…"
                        testId="admin-product-highlights"
                        values={field.state.value ?? []}
                      />
                    </div>
                  )}
                </form.Field>

                <form.Field name="tags">
                  {(field) => (
                    <div className="md:col-span-2">
                      <TagListField
                        description="Search and filter tags — bestseller, newborn…"
                        label="Tags"
                        onChange={field.handleChange}
                        placeholder="Add a tag…"
                        testId="admin-product-tags"
                        values={field.state.value ?? []}
                      />
                    </div>
                  )}
                </form.Field>
              </>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </form>
  );
});

/** Status + bestseller toggle, rendered beside the Save/Create button. */
export function ProductSettingsMenu({
  status,
  isBestseller,
  onStatusChange,
  onBestsellerChange,
}: {
  status: ProductStatus;
  isBestseller: boolean;
  onStatusChange: (status: ProductStatus) => void;
  onBestsellerChange: (value: boolean) => void;
}) {
  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            data-testid="admin-product-settings-trigger"
            size="icon"
            type="button"
            variant="outline"
          >
            <Settings2 />
          </Button>
        }
      />
      <PopoverContent align="end" className="w-72">
        <div className="flex flex-col gap-4">
          <Field>
            <FieldLabel>Status</FieldLabel>
            <ToggleGroup
              className="flex-wrap"
              onValueChange={(value) => {
                const next = value.at(-1) as ProductStatus | undefined;
                if (next) {
                  onStatusChange(next);
                }
              }}
              value={[status]}
            >
              {PRODUCT_STATUSES.map((option) => (
                <ToggleGroupItem key={option} value={option}>
                  {option}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </Field>

          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-0.5">
              <FieldLabel htmlFor="product-bestseller">Bestseller</FieldLabel>
              <p className="text-muted-foreground text-xs">
                Manually flag it — not derived from rating.
              </p>
            </div>
            <Switch
              checked={isBestseller}
              id="product-bestseller"
              onCheckedChange={onBestsellerChange}
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default ProductForm;
