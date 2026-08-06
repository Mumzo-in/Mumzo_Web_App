import { Button } from "@mumzo/ui/components/button";
import { Card, CardContent } from "@mumzo/ui/components/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@mumzo/ui/components/dialog";
import {
  Field,
  FieldDescription,
  FieldLabel,
} from "@mumzo/ui/components/field";
import { Switch } from "@mumzo/ui/components/switch";
import { cn } from "@mumzo/ui/lib/utils";
import { useForm } from "@tanstack/react-form";
import { Eye, RotateCw, Upload } from "lucide-react";
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
import { ColorField, TextField } from "@/core/components/form-fields";
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
  };
}

function valuesFrom(category: CategoryWithCount) {
  return {
    slug: category.slug,
    name: category.name,
    tagline: category.tagline,
    color: category.color,
    isActive: category.isActive,
    hasSizes: category.hasSizes,
  };
}

const SECTIONS = [
  { id: "base", label: "Base", description: "Name, slug and cover image." },
  {
    id: "settings",
    label: "Settings",
    description: "Visibility and product behavior.",
  },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

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
  const [activeSection, setActiveSection] = useState<SectionId>("base");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverUpload = useImageSlotUpload("cover");
  const [coverSessionId, setCoverSessionId] = useState<string | undefined>();
  const coverPreview = coverUpload.url ?? category?.img ?? null;

  const form = useForm({
    defaultValues: category ? valuesFrom(category) : emptyValues(),
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
      <div className="grid gap-5 md:grid-cols-[240px_1fr]">
        <div className="flex flex-col gap-3">
          <nav
            aria-label="Category form sections"
            className="flex flex-col gap-1 rounded-2xl border border-border bg-card p-2 shadow-warm"
            data-testid="admin-category-form-nav"
          >
            {SECTIONS.map((section) => (
              <button
                className={cn(
                  "flex flex-col gap-0.5 rounded-xl px-4 py-3 text-left transition-colors",
                  activeSection === section.id
                    ? "bg-primary/10 text-primary"
                    : "text-foreground hover:bg-secondary",
                )}
                data-testid={`admin-category-section-${section.id}`}
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

          <Dialog>
            <DialogTrigger
              render={
                <Button
                  className="mt-1"
                  data-testid="admin-category-preview-trigger"
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  <Eye data-icon="inline-start" />
                  Preview
                </Button>
              }
            />
            <DialogContent className="sm:max-w-xs">
              <DialogHeader>
                <DialogTitle>Storefront preview</DialogTitle>
              </DialogHeader>
              <form.Subscribe selector={(state) => state.values}>
                {(values) => (
                  <Card
                    className="relative aspect-[1/1.05] overflow-hidden rounded-2xl border"
                    style={{ backgroundColor: values.color || "#F6F3EC" }}
                  >
                    {coverPreview ? (
                      <img
                        alt=""
                        className="absolute right-[-8%] bottom-[-6%] h-[62%] w-[70%] rounded-2xl object-cover shadow-md"
                        src={coverPreview}
                      />
                    ) : (
                      <div className="absolute right-[-8%] bottom-[-6%] flex h-[62%] w-[70%] items-center justify-center rounded-2xl border border-white/20 bg-white/35">
                        <span className="select-none text-3xl opacity-20 grayscale filter">
                          👶
                        </span>
                      </div>
                    )}
                    <div className="relative flex h-full flex-col justify-start p-4">
                      <p className="font-semibold text-[10px] text-foreground/60 uppercase tracking-widest">
                        Shelf
                      </p>
                      <p className="mt-1 max-w-[70%] font-bold font-serif text-foreground text-lg leading-tight">
                        {values.name || "Category name"}
                      </p>
                      <p className="mt-1 line-clamp-2 max-w-[65%] text-[11px] text-foreground/55 leading-relaxed">
                        {values.tagline}
                      </p>
                    </div>
                  </Card>
                )}
              </form.Subscribe>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="shadow-warm">
          <CardContent className="grid gap-5 pt-6 md:grid-cols-2">
            {activeSection === "base" ? (
              <>
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
                    <ColorField
                      description="Hex wash behind the category tile, e.g. #FCE1E6."
                      field={field}
                      label="Color"
                      placeholder="#FCE1E6"
                      testId="admin-category-color"
                    />
                  )}
                </form.Field>

                <Field>
                  <FieldLabel htmlFor="category-cover-upload">
                    Cover image
                  </FieldLabel>
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
                            .then((result) =>
                              setCoverSessionId(result.sessionId),
                            )
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
              </>
            ) : (
              <>
                <form.Field name="isActive">
                  {(field) => (
                    <Field>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={field.state.value}
                          id={field.name}
                          onCheckedChange={(checked) =>
                            field.handleChange(checked)
                          }
                        />
                        <FieldLabel htmlFor={field.name}>Active</FieldLabel>
                      </div>
                    </Field>
                  )}
                </form.Field>

                <form.Field name="hasSizes">
                  {(field) => (
                    <Field>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={field.state.value}
                          id={field.name}
                          onCheckedChange={(checked) =>
                            field.handleChange(checked)
                          }
                        />
                        <FieldLabel htmlFor={field.name}>
                          Products carry sizes
                        </FieldLabel>
                      </div>
                    </Field>
                  )}
                </form.Field>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </form>
  );
});

export default CategoryForm;
