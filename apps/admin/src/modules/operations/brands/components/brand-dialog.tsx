import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@mumzo/ui/components/avatar";
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
import { Switch } from "@mumzo/ui/components/switch";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { queryKeys } from "@/core/api/query-keys";
import { type Brand, createBrand, updateBrand } from "../api/brands-api";

const schema = z.object({
  name: z.string().min(1, "Give the brand a name.").max(80),
  slug: z
    .string()
    .min(1, "Slug is required.")
    .max(80)
    .regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers and hyphens only."),
  logoUrl: z
    .string()
    .url("Enter a valid image URL.")
    .nullable()
    .or(z.literal("").transform(() => null)),
  isActive: z.boolean(),
});

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Create when `brand` is absent, edit in place when it's supplied. */
export function BrandDialog({ brand }: { brand?: Brand }) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const isEdit = Boolean(brand);

  const mutation = useMutation({
    mutationFn: async (value: z.infer<typeof schema>) => {
      if (brand) {
        await updateBrand(brand.id, value);
        return;
      }
      await createBrand(value);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.brands.all });
      toast.success(isEdit ? "Brand updated." : "Brand created.");
      setOpen(false);
      if (!isEdit) {
        form.reset();
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "Could not save the brand.");
    },
  });

  const form = useForm({
    defaultValues: {
      name: brand?.name ?? "",
      slug: brand?.slug ?? "",
      logoUrl: brand?.logoUrl ?? null,
      isActive: brand?.isActive ?? true,
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
            <Button data-testid="create-brand" />
          )
        }
      >
        {isEdit ? (
          "Edit"
        ) : (
          <>
            <Plus data-icon="inline-start" />
            New brand
          </>
        )}
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit brand" : "Create a brand"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update this brand's directory listing."
              : "Brands are what products and categories are organized under."}
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
            <form.Field name="name">
              {(field) => {
                const invalid = field.state.meta.errors.length > 0;
                return (
                  <Field data-invalid={invalid || undefined}>
                    <FieldLabel htmlFor={field.name}>Name</FieldLabel>
                    <Input
                      aria-invalid={invalid || undefined}
                      data-testid="brand-name"
                      id={field.name}
                      onBlur={field.handleBlur}
                      onChange={(event) => {
                        field.handleChange(event.target.value);
                        if (!isEdit && !form.getFieldValue("slug")) {
                          form.setFieldValue(
                            "slug",
                            slugify(event.target.value),
                          );
                        }
                      }}
                      placeholder="Mumzo Essentials"
                      value={field.state.value}
                    />
                    {invalid ? (
                      <FieldError errors={field.state.meta.errors} />
                    ) : null}
                  </Field>
                );
              }}
            </form.Field>

            <form.Field name="slug">
              {(field) => {
                const invalid = field.state.meta.errors.length > 0;
                return (
                  <Field data-invalid={invalid || undefined}>
                    <FieldLabel htmlFor={field.name}>Slug</FieldLabel>
                    <Input
                      aria-invalid={invalid || undefined}
                      data-testid="brand-slug"
                      id={field.name}
                      onBlur={field.handleBlur}
                      onChange={(event) =>
                        field.handleChange(event.target.value)
                      }
                      placeholder="mumzo-essentials"
                      value={field.state.value}
                    />
                    <FieldDescription>
                      Used for the brand's storefront URL.
                    </FieldDescription>
                    {invalid ? (
                      <FieldError errors={field.state.meta.errors} />
                    ) : null}
                  </Field>
                );
              }}
            </form.Field>

            <form.Field name="logoUrl">
              {(field) => {
                const invalid = field.state.meta.errors.length > 0;
                return (
                  <Field data-invalid={invalid || undefined}>
                    <FieldLabel htmlFor={field.name}>Logo URL</FieldLabel>
                    <div className="flex items-center gap-3">
                      <Avatar size="lg">
                        {field.state.value && (
                          <AvatarImage alt="" src={field.state.value} />
                        )}
                        <AvatarFallback>
                          {form.getFieldValue("name").slice(0, 2) || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <Input
                        aria-invalid={invalid || undefined}
                        className="flex-1"
                        data-testid="brand-logo-url"
                        id={field.name}
                        onBlur={field.handleBlur}
                        onChange={(event) =>
                          field.handleChange(event.target.value || null)
                        }
                        placeholder="https://…/logo.png"
                        value={field.state.value ?? ""}
                      />
                    </div>
                    <FieldDescription>
                      Shown in the brand directory and product listings.
                    </FieldDescription>
                    {invalid ? (
                      <FieldError errors={field.state.meta.errors} />
                    ) : null}
                  </Field>
                );
              }}
            </form.Field>

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
              data-testid="submit-brand"
              disabled={mutation.isPending}
              type="submit"
            >
              {mutation.isPending
                ? "Saving…"
                : isEdit
                  ? "Save changes"
                  : "Create brand"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default BrandDialog;
