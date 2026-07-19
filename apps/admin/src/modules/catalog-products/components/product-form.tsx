import {
  AGE_GROUPS,
  discountPct,
  marginPct,
  type Product,
  type ProductFormValues,
  productFormSchema,
  slugify,
} from "@mumzo/catalog-model";
import { Button } from "@mumzo/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@mumzo/ui/components/card";
import { Field, FieldLabel } from "@mumzo/ui/components/field";
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
import { useState } from "react";
import { toast } from "sonner";
import { formatMoney } from "@/core/components/format";
import { categoryOptions } from "@/modules/catalog-categories";
import type { ProductInput } from "../api/products-api";
import { knownBrands, knownTypes } from "../data/product-data";
import {
  ControlField,
  NumberField,
  TextareaField,
  TextField,
} from "./form-fields";
import SizeEditor from "./size-editor";
import StringListEditor from "./string-list-editor";

/** Blank defaults for the create form. */
function emptyValues(): ProductFormValues {
  return {
    name: "",
    slug: "",
    sku: "",
    brand: "",
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
    brand: product.brand,
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

export function ProductForm({
  product,
  onSubmit,
}: {
  /** Present for edit; absent for create. */
  product?: Product;
  onSubmit: (values: ProductInput) => Promise<void>;
}) {
  const [pending, setPending] = useState(false);
  const brands = knownBrands();
  const types = knownTypes();

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

  return (
    <form
      className="flex flex-col gap-6"
      data-testid="admin-product-form"
      onSubmit={(event) => {
        event.preventDefault();
        event.stopPropagation();
        form.handleSubmit();
      }}
    >
      {/* Identity */}
      <Card className="shadow-warm">
        <CardHeader>
          <CardTitle>Identity</CardTitle>
          <CardDescription>What it is and where it lives.</CardDescription>
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
                    field={field}
                    label="Slug"
                    description="Storefront URL segment."
                    testId="admin-product-slug"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mb-6"
                  onClick={() =>
                    field.handleChange(slugify(form.getFieldValue("name")))
                  }
                >
                  From name
                </Button>
              </div>
            )}
          </form.Field>

          <form.Field name="sku">
            {(field) => (
              <TextField field={field} label="SKU" testId="admin-product-sku" />
            )}
          </form.Field>

          <form.Field name="brand">
            {(field) => (
              <TextField
                field={field}
                label="Brand"
                description={
                  brands.length
                    ? `Existing: ${brands.slice(0, 4).join(", ")}…`
                    : undefined
                }
                testId="admin-product-brand"
              />
            )}
          </form.Field>

          <form.Field name="categorySlug">
            {(field) => (
              <ControlField field={field} label="Category">
                <Select
                  value={field.state.value}
                  onValueChange={(value) => field.handleChange(value as never)}
                >
                  <SelectTrigger data-testid="admin-product-category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {categoryOptions().map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
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
                  value={field.state.value}
                  onValueChange={(value) => field.handleChange(value as never)}
                >
                  <SelectTrigger data-testid="admin-product-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {STATUS_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </ControlField>
            )}
          </form.Field>
        </CardContent>
      </Card>

      {/* Pricing */}
      <Card className="shadow-warm">
        <CardHeader>
          <CardTitle>Pricing</CardTitle>
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
                field={field}
                label="Cost price ₹"
                description="What we pay the supplier."
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
              const off = discountPct({ price: price || 0, mrp: mrp || 0 });
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
        </CardContent>
      </Card>

      {/* Packaging */}
      <Card className="shadow-warm">
        <CardHeader>
          <CardTitle>Packaging</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5 md:grid-cols-2">
          <form.Field name="qty">
            {(field) => (
              <TextField
                field={field}
                label="Pack size"
                description="Shown on the storefront — “Pack of 72”, “400 g”."
                testId="admin-product-qty"
              />
            )}
          </form.Field>
          <form.Field name="weight">
            {(field) => (
              <TextField field={field} label="Weight" description="Optional." />
            )}
          </form.Field>
        </CardContent>
      </Card>

      {/* Content */}
      <Card className="shadow-warm">
        <CardHeader>
          <CardTitle>Content</CardTitle>
          <CardDescription>Copy the storefront renders.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <form.Field name="description">
            {(field) => (
              <TextareaField field={field} label="Short description" rows={2} />
            )}
          </form.Field>
          <form.Field name="about">
            {(field) => (
              <TextareaField field={field} label="About this product" />
            )}
          </form.Field>
          <form.Field name="highlights" mode="array">
            {(field) => (
              <ControlField field={field} label="Highlights">
                <StringListEditor
                  value={field.state.value ?? []}
                  onChange={(next) => field.handleChange(next)}
                  placeholder="e.g. Dermatologically tested"
                  addLabel="Add highlight"
                  testId="admin-product-highlights"
                />
              </ControlField>
            )}
          </form.Field>
          <form.Field name="countryOfOrigin">
            {(field) => <TextField field={field} label="Country of origin" />}
          </form.Field>
        </CardContent>
      </Card>

      {/* Merchandising */}
      <Card className="shadow-warm">
        <CardHeader>
          <CardTitle>Merchandising</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <form.Field name="isBestseller">
            {(field) => (
              <Field orientation="horizontal">
                <FieldLabel htmlFor={field.name}>Bestseller</FieldLabel>
                <Switch
                  id={field.name}
                  checked={field.state.value}
                  onCheckedChange={(checked) => field.handleChange(checked)}
                  data-testid="admin-product-bestseller"
                />
              </Field>
            )}
          </form.Field>

          <form.Field name="type">
            {(field) => (
              <TextField
                field={field}
                label="Type"
                description={
                  types.length
                    ? `Existing: ${types.slice(0, 5).join(", ")}…`
                    : undefined
                }
              />
            )}
          </form.Field>

          <form.Field name="ages" mode="array">
            {(field) => (
              <ControlField field={field} label="Age groups">
                <ToggleGroup
                  multiple
                  value={field.state.value}
                  onValueChange={(value) => field.handleChange(value as never)}
                  className="flex-wrap justify-start"
                >
                  {AGE_GROUPS.map((group) => (
                    <ToggleGroupItem
                      key={group.key}
                      value={group.key}
                      data-testid={`admin-product-age-${group.key}`}
                    >
                      {group.label}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </ControlField>
            )}
          </form.Field>

          <form.Field name="tags" mode="array">
            {(field) => (
              <ControlField field={field} label="Tags">
                <StringListEditor
                  value={field.state.value ?? []}
                  onChange={(next) => field.handleChange(next)}
                  placeholder="e.g. newborn"
                  addLabel="Add tag"
                  testId="admin-product-tags"
                />
              </ControlField>
            )}
          </form.Field>
        </CardContent>
      </Card>

      {/* Variants */}
      <Card className="shadow-warm">
        <CardHeader>
          <CardTitle>Variants</CardTitle>
          <CardDescription>
            Sizes with their own price and stock. Total stock is their sum.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form.Field name="sizes" mode="array">
            {(field) => (
              <SizeEditor
                value={field.state.value ?? []}
                onChange={(next) => field.handleChange(next)}
              />
            )}
          </form.Field>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button
          type="submit"
          disabled={pending}
          data-testid="admin-product-submit"
        >
          {pending ? "Saving…" : product ? "Save changes" : "Create product"}
        </Button>
      </div>
    </form>
  );
}

export default ProductForm;
