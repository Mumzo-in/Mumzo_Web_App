import {
  AGE_GROUPS,
  discountPct,
  marginPct,
  type Product,
  type ProductFormValues,
  productFormSchema,
  slugify,
} from "@mumzo/schema";
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
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@mumzo/ui/components/empty";
import { Field, FieldLabel } from "@mumzo/ui/components/field";
import { RichTextEditor } from "@mumzo/ui/components/rich-text-editor";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@mumzo/ui/components/select";
import { Switch } from "@mumzo/ui/components/switch";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@mumzo/ui/components/toggle-group";
import { useForm } from "@tanstack/react-form";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  Banknote,
  FileText,
  Layers,
  type LucideIcon,
  PackagePlus,
  Sparkles,
  Tag,
} from "lucide-react";
import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { toast } from "sonner";
import ComingSoon from "@/core/components/coming-soon";
import {
  ControlField,
  NumberField,
  TextareaField,
  TextField,
} from "@/core/components/form-fields";
import { formatMoney } from "@/core/components/format";
import StringListEditor from "@/core/components/string-list-editor";
import { brandsQueryOptions } from "@/modules/operations/brands";
import { categoriesQueryOptions } from "@/modules/operations/categories";
import { vendorsQueryOptions } from "@/modules/operations/vendors";
import type { ProductInput } from "../api/products-api";
import { FormSidebarTab } from "./form-sidebar-tab";
import SizeEditor from "./size-editor";

/** Blank defaults for the create form. */
function emptyValues(): ProductFormValues {
  return {
    name: "",
    slug: "",
    sku: "",
    brandId: "",
    vendorId: null,
    categorySlug: "baby-essentials",
    status: "draft",
    price: 0,
    mrp: 0,
    costPrice: null,
    qty: "",
    weight: null,
    description: "",
    about: "",
    highlights: [],
    countryOfOrigin: "India",
    images: [],
    sizes: [],
    ages: [],
    type: "",
    tags: [],
    isBestseller: false,
  };
}

/** Pulls form values out of an existing product for the edit form. */
function valuesFrom(product: Product): ProductFormValues {
  return {
    name: product.name,
    slug: product.slug,
    sku: product.sku,
    brandId: product.brandId,
    vendorId: product.vendorId,
    categorySlug: product.categorySlug,
    status: product.status,
    price: product.price,
    mrp: product.mrp,
    costPrice: product.costPrice,
    qty: product.qty,
    weight: product.weight,
    description: product.description,
    about: product.about,
    highlights: product.highlights,
    countryOfOrigin: product.countryOfOrigin,
    images: product.images,
    sizes: product.sizes,
    ages: product.ages,
    type: product.type,
    tags: product.tags,
    isBestseller: product.isBestseller,
  };
}

const STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "active", label: "Active" },
  { value: "archived", label: "Archived" },
] as const;

/** Sections mirror the sidebar nav — each owns a slice of the field set. */
const SECTIONS = [
  {
    key: "basic",
    label: "Basic Info",
    description: "Identity & content",
    icon: FileText,
    fields: [
      "name",
      "slug",
      "sku",
      "brandId",
      "vendorId",
      "categorySlug",
      "status",
      "description",
      "about",
      "highlights",
      "countryOfOrigin",
    ],
  },
  {
    key: "pricing",
    label: "Pricing & Stock",
    description: "Price, MRP, packaging",
    icon: Banknote,
    fields: ["price", "mrp", "costPrice", "qty", "weight"],
  },
  {
    key: "variants",
    label: "Variants",
    description: "Sizes & per-size stock",
    icon: Layers,
    fields: ["sizes"],
  },
  {
    key: "merchandising",
    label: "Merchandising",
    description: "Discovery & tagging",
    icon: Sparkles,
    fields: ["isBestseller", "type", "ages", "tags"],
  },
  {
    key: "bundles",
    label: "Bundles",
    description: "Combo & multi-buy deals",
    icon: PackagePlus,
    fields: [],
  },
  {
    key: "offers",
    label: "Offers",
    description: "Coupons & promotions",
    icon: Tag,
    fields: [],
  },
] as const satisfies ReadonlyArray<{
  key: string;
  label: string;
  description: string;
  icon: LucideIcon;
  fields: readonly (keyof ProductFormValues)[];
}>;

type SectionKey = (typeof SECTIONS)[number]["key"];

/** Imperative handle so a page can trigger submit from outside the form tree (e.g. a PageHeader action). */
export type ProductFormHandle = {
  submit: () => void;
};

export const ProductForm = forwardRef<
  ProductFormHandle,
  {
    /** Present for edit; absent for create. */
    product?: Product;
    onSubmit: (values: ProductInput) => Promise<void>;
    /** Reports saving state so a header-level submit button can disable/label itself. */
    onPendingChange?: (pending: boolean) => void;
  }
>(function ProductForm({ product, onSubmit, onPendingChange }, ref) {
  const [pending, setPending] = useState(false);
  const [activeSection, setActiveSection] = useState<SectionKey>(
    SECTIONS[0].key,
  );
  const { data: brands } = useQuery(brandsQueryOptions);
  const { data: vendors } = useQuery(vendorsQueryOptions);
  const { data: categories } = useQuery(categoriesQueryOptions);

  const form = useForm({
    defaultValues: product ? valuesFrom(product) : emptyValues(),
    validators: { onSubmit: productFormSchema },
    onSubmit: async ({ value }) => {
      setPending(true);
      try {
        // Schema output is the wire shape minus server-owned fields.
        await onSubmit(value as ProductInput);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Couldn't save the product.",
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

  return (
    <form
      data-testid="admin-product-form"
      onSubmit={(event) => {
        event.preventDefault();
        event.stopPropagation();
        form.handleSubmit();
      }}
    >
      <div className="grid items-start gap-6 lg:grid-cols-[260px_1fr]">
        <aside className="flex flex-col gap-1 rounded-3xl border border-border bg-card p-2 shadow-warm lg:sticky lg:top-6">
          <form.Subscribe selector={(state) => state.errorMap}>
            {(errorMap) =>
              SECTIONS.map((section) => {
                const sectionErrors = section.fields.flatMap(
                  (name) => errorMap.onSubmit?.[name] ?? [],
                );
                return (
                  <FormSidebarTab
                    description={section.description}
                    hasErrors={sectionErrors.length > 0}
                    icon={section.icon}
                    isActive={activeSection === section.key}
                    isComplete={sectionErrors.length === 0}
                    key={section.key}
                    label={section.label}
                    onClick={() => setActiveSection(section.key)}
                    testId={`admin-product-tab-${section.key}`}
                  />
                );
              })
            }
          </form.Subscribe>
        </aside>

        <main className="flex flex-col gap-6">
          {activeSection === "basic" ? (
            <Card className="shadow-warm">
              <CardHeader>
                <CardTitle>Basic Info</CardTitle>
                <CardDescription>
                  What it is and where it lives.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-5 md:grid-cols-2">
                <form.Field name="name">
                  {(field) => (
                    <TextField
                      field={field}
                      label="Name"
                      testId="admin-product-name"
                    />
                  )}
                </form.Field>

                <form.Field name="slug">
                  {(field) => (
                    <div className="flex items-end gap-2">
                      <div className="flex-1">
                        <TextField
                          description="Storefront URL segment."
                          field={field}
                          label="Slug"
                          testId="admin-product-slug"
                        />
                      </div>
                      <Button
                        className="mb-6"
                        onClick={() =>
                          field.handleChange(
                            slugify(form.getFieldValue("name")),
                          )
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

                <form.Field name="sku">
                  {(field) => (
                    <TextField
                      field={field}
                      label="SKU"
                      testId="admin-product-sku"
                    />
                  )}
                </form.Field>

                <form.Field name="brandId">
                  {(field) => (
                    <ControlField field={field} label="Brand">
                      <Select
                        onValueChange={(value) =>
                          field.handleChange(value ?? "")
                        }
                        value={field.state.value}
                      >
                        <SelectTrigger data-testid="admin-product-brand">
                          <SelectValue placeholder="Pick a brand" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            {(brands ?? []).map((brand) => (
                              <SelectItem key={brand.id} value={brand.id}>
                                {brand.name}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </ControlField>
                  )}
                </form.Field>

                <form.Field name="vendorId">
                  {(field) => (
                    <ControlField field={field} label="Vendor">
                      <Select
                        onValueChange={(value) =>
                          field.handleChange(value === "none" ? null : value)
                        }
                        value={field.state.value ?? "none"}
                      >
                        <SelectTrigger data-testid="admin-product-vendor">
                          <SelectValue placeholder="Pick a vendor" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectItem value="none">No vendor</SelectItem>
                            {(vendors ?? []).map((vendor) => (
                              <SelectItem key={vendor.id} value={vendor.id}>
                                {vendor.name}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </ControlField>
                  )}
                </form.Field>

                <form.Field name="categorySlug">
                  {(field) => (
                    <ControlField field={field} label="Category">
                      <Select
                        onValueChange={(value) =>
                          field.handleChange(value as never)
                        }
                        value={field.state.value}
                      >
                        <SelectTrigger data-testid="admin-product-category">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            {(categories ?? []).map((category) => (
                              <SelectItem
                                key={category.slug}
                                value={category.slug}
                              >
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </ControlField>
                  )}
                </form.Field>

                <form.Field name="status">
                  {(field) => (
                    <ControlField field={field} label="Status">
                      <Select
                        onValueChange={(value) =>
                          field.handleChange(value as never)
                        }
                        value={field.state.value}
                      >
                        <SelectTrigger data-testid="admin-product-status">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            {STATUS_OPTIONS.map((option) => (
                              <SelectItem
                                key={option.value}
                                value={option.value}
                              >
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </ControlField>
                  )}
                </form.Field>

                <form.Field name="description">
                  {(field) => (
                    <div className="md:col-span-2">
                      <TextareaField
                        field={field}
                        label="Short description"
                        rows={2}
                      />
                    </div>
                  )}
                </form.Field>
                <form.Field name="about">
                  {(field) => (
                    <div className="md:col-span-2">
                      <ControlField field={field} label="About this product">
                        <RichTextEditor
                          onChange={(html) => field.handleChange(html)}
                          placeholder="Longer-form copy for the product detail page…"
                          testId="admin-product-about"
                          value={field.state.value ?? ""}
                        />
                      </ControlField>
                    </div>
                  )}
                </form.Field>
                <form.Field mode="array" name="highlights">
                  {(field) => (
                    <div className="md:col-span-2">
                      <ControlField field={field} label="Highlights">
                        <StringListEditor
                          addLabel="Add highlight"
                          onChange={(next) => field.handleChange(next)}
                          placeholder="e.g. Dermatologically tested"
                          testId="admin-product-highlights"
                          value={field.state.value ?? []}
                        />
                      </ControlField>
                    </div>
                  )}
                </form.Field>
                <form.Field name="countryOfOrigin">
                  {(field) => (
                    <TextField field={field} label="Country of origin" />
                  )}
                </form.Field>
              </CardContent>
            </Card>
          ) : null}

          {activeSection === "pricing" ? (
            <Card className="shadow-warm">
              <CardHeader>
                <CardTitle>Pricing & Stock</CardTitle>
                <CardDescription>
                  What it costs, and how it's packaged.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-5 md:grid-cols-3">
                <form.Field name="price">
                  {(field) => (
                    <NumberField
                      field={field}
                      label="Selling price ₹"
                      testId="admin-product-price"
                    />
                  )}
                </form.Field>
                <form.Field name="mrp">
                  {(field) => (
                    <NumberField
                      field={field}
                      label="MRP ₹"
                      testId="admin-product-mrp"
                    />
                  )}
                </form.Field>
                <form.Field name="costPrice">
                  {(field) => (
                    <NumberField
                      description="What we pay the supplier."
                      field={field}
                      label="Cost price ₹"
                    />
                  )}
                </form.Field>

                {/* Live derived preview — discount and margin. */}
                <form.Subscribe
                  selector={(state) => ({
                    price: state.values.price,
                    mrp: state.values.mrp,
                    cost: state.values.costPrice,
                  })}
                >
                  {({ price, mrp, cost }) => {
                    const off = discountPct({
                      price: price || 0,
                      mrp: mrp || 0,
                    });
                    const margin = marginPct({
                      price: price || 0,
                      costPrice: cost,
                    });
                    return (
                      <p
                        className="numeric text-muted-foreground text-sm md:col-span-3"
                        data-testid="admin-product-price-preview"
                      >
                        {off > 0
                          ? `${off}% off MRP (saves ${formatMoney((mrp || 0) - (price || 0))}).`
                          : "No discount vs MRP."}
                        {margin !== null ? ` Margin ${margin}%.` : ""}
                      </p>
                    );
                  }}
                </form.Subscribe>

                <form.Field name="qty">
                  {(field) => (
                    <TextField
                      description="Shown on the storefront — “Pack of 72”, “400 g”."
                      field={field}
                      label="Pack size"
                      testId="admin-product-qty"
                    />
                  )}
                </form.Field>
                <form.Field name="weight">
                  {(field) => (
                    <TextField
                      description="Optional."
                      field={field}
                      label="Weight"
                    />
                  )}
                </form.Field>
              </CardContent>
            </Card>
          ) : null}

          {activeSection === "variants" ? (
            <Card className="shadow-warm">
              <CardHeader>
                <CardTitle>Variants</CardTitle>
                <CardDescription>
                  Sizes with their own price and stock. Total stock is their
                  sum.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form.Field mode="array" name="sizes">
                  {(field) => (
                    <SizeEditor
                      onChange={(next) => field.handleChange(next)}
                      value={field.state.value ?? []}
                    />
                  )}
                </form.Field>
              </CardContent>
            </Card>
          ) : null}

          {activeSection === "merchandising" ? (
            <Card className="shadow-warm">
              <CardHeader>
                <CardTitle>Merchandising</CardTitle>
                <CardDescription>
                  How the product surfaces in search and cross-sells.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-5">
                <form.Field name="isBestseller">
                  {(field) => (
                    <Field orientation="horizontal">
                      <FieldLabel htmlFor={field.name}>Bestseller</FieldLabel>
                      <Switch
                        checked={field.state.value}
                        data-testid="admin-product-bestseller"
                        id={field.name}
                        onCheckedChange={(checked) =>
                          field.handleChange(checked)
                        }
                      />
                    </Field>
                  )}
                </form.Field>

                <form.Field name="type">
                  {(field) => (
                    <TextField
                      description="Sub-type within the category — “Wipes”, “Formula”."
                      field={field}
                      label="Type"
                    />
                  )}
                </form.Field>

                <form.Field mode="array" name="ages">
                  {(field) => (
                    <ControlField field={field} label="Age groups">
                      <ToggleGroup
                        className="flex-wrap justify-start"
                        multiple
                        onValueChange={(value) =>
                          field.handleChange(value as never)
                        }
                        value={field.state.value}
                      >
                        {AGE_GROUPS.map((group) => (
                          <ToggleGroupItem
                            data-testid={`admin-product-age-${group.key}`}
                            key={group.key}
                            value={group.key}
                          >
                            {group.label}
                          </ToggleGroupItem>
                        ))}
                      </ToggleGroup>
                    </ControlField>
                  )}
                </form.Field>

                <form.Field mode="array" name="tags">
                  {(field) => (
                    <ControlField field={field} label="Tags">
                      <StringListEditor
                        addLabel="Add tag"
                        onChange={(next) => field.handleChange(next)}
                        placeholder="e.g. newborn"
                        testId="admin-product-tags"
                        value={field.state.value ?? []}
                      />
                    </ControlField>
                  )}
                </form.Field>
              </CardContent>
            </Card>
          ) : null}

          {activeSection === "bundles" ? (
            <Card className="shadow-warm">
              <CardHeader>
                <CardTitle>Bundles</CardTitle>
                <CardDescription>
                  Package this product with others as a combo deal.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ComingSoon
                  description="Needs a bundles table and admin API — grouped SKUs with combo pricing aren't built yet."
                  phase={3}
                  needsApiSpec
                  title="Bundles & combos"
                />
              </CardContent>
            </Card>
          ) : null}

          {activeSection === "offers" ? (
            <Card className="shadow-warm">
              <CardHeader>
                <CardTitle>Offers</CardTitle>
                <CardDescription>
                  Coupons and promotions that apply to this product.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Empty data-testid="admin-product-offers-empty">
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <Tag />
                    </EmptyMedia>
                    <EmptyTitle>Not a separate concept</EmptyTitle>
                    <EmptyDescription>
                      Product-level offers aren't tracked here — create or
                      manage a coupon scoped to this product instead.
                    </EmptyDescription>
                  </EmptyHeader>
                  <EmptyContent>
                    <Button render={<Link to="/finance/coupons" />} size="sm">
                      Go to Coupons & Offers
                    </Button>
                  </EmptyContent>
                </Empty>
              </CardContent>
            </Card>
          ) : null}

          {/* <form.Subscribe
            selector={(state) => ({
              isSubmitting: state.isSubmitting,
              canSubmit: state.canSubmit,
            })}
          >
            {({ canSubmit }) => (
              <div className="sticky bottom-0 z-50 -mx-6 mt-2 -mb-6 flex items-center justify-between border-border/40 border-t bg-background/80 px-6 py-4 backdrop-blur-md">
                <div className="text-xs">
                  {!canSubmit && (
                    <span className="flex items-center gap-1.5 font-medium text-destructive">
                      Please fix errors before saving
                    </span>
                  )}
                </div>
                <Button
                  data-testid="admin-product-submit"
                  disabled={pending}
                  type="submit"
                >
                  {pending
                    ? "Saving…"
                    : product
                      ? "Save changes"
                      : "Create product"}
                </Button>
              </div>
            )}
          </form.Subscribe> */}
        </main>
      </div>
    </form>
  );
});

export default ProductForm;
