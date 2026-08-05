import { Button } from "@mumzo/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@mumzo/ui/components/card";
import { Checkbox } from "@mumzo/ui/components/checkbox";
import {
  Field,
  FieldDescription,
  FieldLabel,
} from "@mumzo/ui/components/field";
import { ScrollArea } from "@mumzo/ui/components/scroll-area";
import { Switch } from "@mumzo/ui/components/switch";
import { useForm } from "@tanstack/react-form";
import { useQuery } from "@tanstack/react-query";
import { RotateCw, Upload } from "lucide-react";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import { z } from "zod";
import { useImageSlotUpload } from "@/core/api/use-image-slot-upload";
import { ControlField, TextField } from "@/core/components/form-fields";
import { brandsQueryOptions } from "@/modules/brand";
import type { CategoryInput, CategoryWithCount } from "../api/categories-api";

const schema = z.object({
  slug: z
    .string()
    .min(1, "Slug is required.")
    .max(60)
    .regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers and hyphens only."),
  name: z.string().min(1, "Give the category a name.").max(80),
  tagline: z.string().max(160).nullable(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Expected a hex color, e.g. #FCE1E6.")
    .nullable()
    .or(z.literal("").transform(() => null)),
  isActive: z.boolean(),
  hasSizes: z.boolean(),
  brandIds: z.array(z.string()),
});

/** "Baby Bath & Skin" → "baby-bath-skin". */
function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function emptyValues() {
  return {
    slug: "",
    name: "",
    tagline: null as string | null,
    color: null as string | null,
    isActive: true,
    hasSizes: false,
    brandIds: [] as string[],
  };
}

/**
 * The category detail only carries brand *names* (`Category.brands`,
 * denormalized for storefront filters) — resolve them back to ids against
 * the loaded brand directory so the checkbox list can prefill correctly.
 */
function valuesFrom(
  category: CategoryWithCount,
  brands: { id: string; name: string }[],
) {
  const idsByName = new Map(brands.map((brand) => [brand.name, brand.id]));
  return {
    slug: category.slug,
    name: category.name,
    tagline: category.tagline,
    color: category.color,
    isActive: category.isActive,
    hasSizes: category.hasSizes,
    brandIds: category.brands
      .map((name) => idsByName.get(name))
      .filter((id): id is string => id !== undefined),
  };
}

export type CategoryFormHandle = {
  submit: () => void;
};

/** Imperative handle so a page can trigger submit from a PageHeader action. */
export const CategoryForm = forwardRef<
  CategoryFormHandle,
  {
    /** Present for edit; absent for create. */
    category?: CategoryWithCount;
    onSubmit: (values: CategoryInput) => Promise<void>;
    onPendingChange?: (pending: boolean) => void;
  }
>(function CategoryForm({ category, onSubmit, onPendingChange }, ref) {
  const [pending, setPending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverUpload = useImageSlotUpload("cover");
  const [coverSessionId, setCoverSessionId] = useState<string | undefined>();
  const coverPreview = coverUpload.url ?? category?.img ?? null;

  const brands = useQuery(brandsQueryOptions);

  const form = useForm({
    defaultValues: category ? valuesFrom(category, []) : emptyValues(),
    validators: { onSubmit: schema },
    onSubmit: async ({ value }) => {
      setPending(true);
      try {
        await onSubmit({
          ...value,
          uploadSessionId: coverSessionId,
        } as CategoryInput);
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Couldn't save the category.",
        );
      } finally {
        setPending(false);
      }
    },
  });

  useEffect(() => {
    onPendingChange?.(pending);
  }, [pending, onPendingChange]);

  // Brand ids can only be resolved once the brand directory has loaded (the
  // category detail carries names, not ids) — backfill the field then.
  useEffect(() => {
    if (category && brands.data) {
      form.setFieldValue(
        "brandIds",
        valuesFrom(category, brands.data).brandIds,
      );
    }
  }, [category, brands.data, form.setFieldValue]);

  useImperativeHandle(ref, () => ({
    submit: () => form.handleSubmit(),
  }));

  return (
    <form
      data-testid="admin-category-form"
      onSubmit={(event) => {
        event.preventDefault();
        event.stopPropagation();
        form.handleSubmit();
      }}
    >
      <Card className="shadow-warm">
        <CardHeader>
          <CardTitle>Category details</CardTitle>
          <CardDescription>
            Taxonomy node shown in navigation and used to organize products.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5 md:grid-cols-2">
          <form.Field name="name">
            {(field) => (
              <TextField
                field={field}
                label="Name"
                placeholder="Bath & Skin"
                testId="admin-category-name"
              />
            )}
          </form.Field>

          <form.Field name="slug">
            {(field) => (
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <TextField
                    description="Used in the storefront URL."
                    field={field}
                    label="Slug"
                    placeholder="bath-skin"
                    testId="admin-category-slug"
                  />
                </div>
                {category ? null : (
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
                )}
              </div>
            )}
          </form.Field>

          <form.Field name="tagline">
            {(field) => (
              <div className="md:col-span-2">
                <TextField
                  description="Optional. Shown under the category name."
                  field={field}
                  label="Tagline"
                />
              </div>
            )}
          </form.Field>

          <form.Field name="color">
            {(field) => (
              <TextField
                description="Hex wash behind the category tile, e.g. #FCE1E6."
                field={field}
                label="Color"
                placeholder="#FCE1E6"
                testId="admin-category-color"
              />
            )}
          </form.Field>

          <Field>
            <FieldLabel htmlFor="category-cover-upload">Cover image</FieldLabel>
            <div className="flex items-center gap-3">
              {coverPreview ? (
                <img
                  alt=""
                  className="size-16 rounded-2xl border object-cover"
                  src={coverPreview}
                />
              ) : (
                <div className="size-16 rounded-2xl border bg-secondary" />
              )}
              <input
                accept="image/*"
                className="hidden"
                id="category-cover-upload"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) {
                    coverUpload
                      .upload(file, {
                        entity: "categories",
                        sessionId: coverSessionId,
                      })
                      .then((result) => setCoverSessionId(result.sessionId))
                      .catch(() => undefined);
                  }
                  event.target.value = "";
                }}
                ref={fileInputRef}
                type="file"
              />
              <Button
                data-testid="admin-category-cover-upload-trigger"
                disabled={coverUpload.status === "uploading"}
                onClick={() => fileInputRef.current?.click()}
                size="sm"
                type="button"
                variant="outline"
              >
                {coverUpload.status === "uploading" ? (
                  <>
                    <RotateCw
                      className="animate-spin"
                      data-icon="inline-start"
                    />
                    Uploading…
                  </>
                ) : (
                  <>
                    <Upload data-icon="inline-start" />
                    {coverPreview ? "Replace cover" : "Upload cover"}
                  </>
                )}
              </Button>
              {coverUpload.status === "error" ? (
                <Button
                  onClick={() =>
                    coverUpload
                      .retry()
                      .then(
                        (result) =>
                          result && setCoverSessionId(result.sessionId),
                      )
                  }
                  size="sm"
                  type="button"
                  variant="ghost"
                >
                  Retry
                </Button>
              ) : null}
            </div>
            <FieldDescription>
              Hero/tile image shown in navigation and category pages.
            </FieldDescription>
            {coverUpload.status === "error" ? (
              <p className="text-destructive text-xs">
                {coverUpload.error ?? "Upload failed."}
              </p>
            ) : null}
          </Field>

          <form.Field name="isActive">
            {(field) => (
              <Field orientation="horizontal">
                <FieldLabel htmlFor={field.name}>Active</FieldLabel>
                <Switch
                  checked={field.state.value}
                  id={field.name}
                  onCheckedChange={(checked) => field.handleChange(checked)}
                />
              </Field>
            )}
          </form.Field>

          <form.Field name="hasSizes">
            {(field) => (
              <ControlField field={field} label="Products carry sizes">
                <Switch
                  checked={field.state.value}
                  id={field.name}
                  onCheckedChange={(checked) => field.handleChange(checked)}
                />
              </ControlField>
            )}
          </form.Field>

          <form.Field name="brandIds">
            {(field) => (
              <div className="md:col-span-2">
                <Field>
                  <FieldLabel>Brands stocked here</FieldLabel>
                  <ScrollArea className="h-48 rounded-xl border p-3">
                    <div className="flex flex-col gap-2">
                      {(brands.data ?? []).map((brand) => {
                        const checked = field.state.value.includes(brand.id);
                        return (
                          <div
                            className="flex items-center gap-2"
                            key={brand.id}
                          >
                            <Checkbox
                              checked={checked}
                              id={`category-brand-${brand.id}`}
                              onCheckedChange={(next) => {
                                field.handleChange(
                                  next
                                    ? [...field.state.value, brand.id]
                                    : field.state.value.filter(
                                        (id) => id !== brand.id,
                                      ),
                                );
                              }}
                            />
                            <FieldLabel
                              className="cursor-pointer font-normal text-sm"
                              htmlFor={`category-brand-${brand.id}`}
                            >
                              {brand.name}
                            </FieldLabel>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                  <FieldDescription>
                    Denormalized onto the category for storefront filters.
                  </FieldDescription>
                </Field>
              </div>
            )}
          </form.Field>
        </CardContent>
      </Card>
    </form>
  );
});

export default CategoryForm;
