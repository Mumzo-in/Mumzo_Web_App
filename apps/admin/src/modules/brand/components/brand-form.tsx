import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@mumzo/ui/components/avatar";
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
import { TextField } from "@/core/components/form-fields";
import { CategorySelect } from "@/modules/category";
import type { Brand, BrandInput } from "../api/brands-api";

const schema = z.object({
  name: z.string().min(1, "Give the brand a name.").max(80),
  slug: z
    .string()
    .min(1, "Slug is required.")
    .max(80)
    .regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers and hyphens only."),
  isActive: z.boolean(),
  categorySlugs: z.array(z.string()),
});

/** "Mumzo Essentials" → "mumzo-essentials". */
function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function emptyValues() {
  return {
    name: "",
    slug: "",
    isActive: true,
    categorySlugs: [] as string[],
  };
}

function valuesFrom(brand: Brand) {
  return {
    name: brand.name,
    slug: brand.slug,
    isActive: brand.isActive,
    categorySlugs: brand.categorySlugs,
  };
}

const SECTIONS = [
  { id: "base", label: "Base", description: "Name, slug and logo." },
  { id: "settings", label: "Settings", description: "Visibility." },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

export type BrandFormHandle = {
  submit: () => void;
};

/** Imperative handle so a page can trigger submit from a PageHeader action. */
export const BrandForm = forwardRef<
  BrandFormHandle,
  {
    /** Present for edit; absent for create. */
    brand?: Brand;
    onSubmit: (values: BrandInput) => Promise<void>;
    onPendingChange?: (pending: boolean) => void;
  }
>(function BrandForm({ brand, onSubmit, onPendingChange }, ref) {
  const [pending, setPending] = useState(false);
  const [activeSection, setActiveSection] = useState<SectionId>("base");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoUpload = useImageSlotUpload("logo");
  const [logoSessionId, setLogoSessionId] = useState<string | undefined>();
  const logoPreview = logoUpload.url ?? brand?.logoUrl ?? null;

  const form = useForm({
    defaultValues: brand ? valuesFrom(brand) : emptyValues(),
    validators: { onSubmit: schema },
    onSubmit: async ({ value }) => {
      setPending(true);
      try {
        await onSubmit({
          ...value,
          uploadSessionId: logoSessionId,
        } as BrandInput);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Couldn't save the brand.",
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
      data-testid="admin-brand-form"
      onSubmit={(event) => {
        event.preventDefault();
        event.stopPropagation();
        form.handleSubmit();
      }}
    >
      <div className="grid gap-5 md:grid-cols-[240px_1fr]">
        <div className="flex flex-col gap-3">
          <nav
            aria-label="Brand form sections"
            className="flex flex-col gap-1 rounded-2xl border border-border bg-card p-2 shadow-warm"
            data-testid="admin-brand-form-nav"
          >
            {SECTIONS.map((section) => (
              <button
                className={cn(
                  "flex flex-col gap-0.5 rounded-xl px-4 py-3 text-left transition-colors",
                  activeSection === section.id
                    ? "bg-primary/10 text-primary"
                    : "text-foreground hover:bg-secondary",
                )}
                data-testid={`admin-brand-section-${section.id}`}
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
                  data-testid="admin-brand-preview-trigger"
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
                  <Card className="flex flex-col items-center gap-3 p-6">
                    <Avatar size="lg">
                      {logoPreview ? (
                        <AvatarImage alt="" src={logoPreview} />
                      ) : null}
                      <AvatarFallback>
                        {(values.name || "?").slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <p className="font-bold font-serif text-foreground text-lg leading-tight">
                      {values.name || "Brand name"}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {values.isActive ? "Shown in filters" : "Hidden"}
                    </p>
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
                      placeholder="Mumzo Essentials"
                      testId="admin-brand-name"
                    />
                  )}
                </form.Field>

                <form.Field name="slug">
                  {(field) => (
                    <div className="flex items-end gap-2">
                      <div className="flex-1">
                        <TextField
                          description="Used for the brand's storefront URL."
                          field={field}
                          label="Slug"
                          placeholder="mumzo-essentials"
                          testId="admin-brand-slug"
                        />
                      </div>
                      {brand ? null : (
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

                <Field className="md:col-span-2">
                  <FieldLabel htmlFor="brand-logo-upload">Logo</FieldLabel>
                  <div className="flex items-center gap-3">
                    <Avatar size="lg">
                      {logoPreview ? (
                        <AvatarImage alt="" src={logoPreview} />
                      ) : null}
                      <AvatarFallback>
                        {(form.getFieldValue("name") || "?").slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <input
                      accept="image/*"
                      className="hidden"
                      id="brand-logo-upload"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) {
                          logoUpload
                            .upload(file, {
                              entity: "brands",
                              sessionId: logoSessionId,
                            })
                            .then((result) =>
                              setLogoSessionId(result.sessionId),
                            )
                            .catch(() => undefined);
                        }
                        event.target.value = "";
                      }}
                      ref={fileInputRef}
                      type="file"
                    />
                    <Button
                      data-testid="admin-brand-logo-upload-trigger"
                      disabled={logoUpload.status === "uploading"}
                      onClick={() => fileInputRef.current?.click()}
                      size="sm"
                      type="button"
                      variant="outline"
                    >
                      {logoUpload.status === "uploading" ? (
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
                          {logoPreview ? "Replace logo" : "Upload logo"}
                        </>
                      )}
                    </Button>
                    {logoUpload.status === "error" ? (
                      <Button
                        onClick={() =>
                          logoUpload
                            .retry()
                            .then(
                              (result) =>
                                result && setLogoSessionId(result.sessionId),
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
                    Shown in the brand directory and product listings.
                  </FieldDescription>
                  {logoUpload.status === "error" ? (
                    <p className="text-destructive text-xs">
                      {logoUpload.error ?? "Upload failed."}
                    </p>
                  ) : null}
                </Field>

                <form.Field name="categorySlugs">
                  {(field) => (
                    <div className="md:col-span-2">
                      <CategorySelect
                        description="Product categories this brand is stocked under."
                        field={field}
                        label="Categories"
                      />
                    </div>
                  )}
                </form.Field>
              </>
            ) : (
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
            )}
          </CardContent>
        </Card>
      </div>
    </form>
  );
});

export default BrandForm;
