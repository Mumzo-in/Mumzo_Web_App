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
import { useForm } from "@tanstack/react-form";
import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { ControlField, TextField } from "@/core/components/form-fields";
import type { Vendor, VendorInput } from "../api/vendors-api";
import { VENDOR_TYPE_OPTIONS } from "../data/vendor-data";

const schema = z.object({
  name: z.string().min(1, "Give the vendor a name.").max(120),
  slug: z
    .string()
    .min(1, "Slug is required.")
    .max(120)
    .regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers and hyphens only."),
  type: z.enum(["retailer", "store", "distributor"]),
  contactName: z.string().max(120).nullable(),
  phone: z.string().max(20).nullable(),
  email: z
    .string()
    .email("Enter a valid email.")
    .nullable()
    .or(z.literal(""))
    .transform((value) => value || null),
  address: z.string().max(500).nullable(),
  gstin: z.string().max(20).nullable(),
  isActive: z.boolean(),
});

/** "Hyderabad Baby Depot" → "hyderabad-baby-depot". */
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
    type: "distributor" as const,
    contactName: null as string | null,
    phone: null as string | null,
    email: null as string | null,
    address: null as string | null,
    gstin: null as string | null,
    isActive: true,
  };
}

function valuesFrom(vendor: Vendor) {
  return {
    name: vendor.name,
    slug: vendor.slug,
    type: vendor.type,
    contactName: vendor.contactName,
    phone: vendor.phone,
    email: vendor.email,
    address: vendor.address,
    gstin: vendor.gstin,
    isActive: vendor.isActive,
  };
}

export type VendorFormHandle = {
  submit: () => void;
};

/** Imperative handle so a page can trigger submit from outside the form tree (e.g. a PageHeader action). */
export const VendorForm = forwardRef<
  VendorFormHandle,
  {
    /** Present for edit; absent for create. */
    vendor?: Vendor;
    onSubmit: (values: VendorInput) => Promise<void>;
    onPendingChange?: (pending: boolean) => void;
  }
>(function VendorForm({ vendor, onSubmit, onPendingChange }, ref) {
  const [pending, setPending] = useState(false);

  const form = useForm({
    defaultValues: vendor ? valuesFrom(vendor) : emptyValues(),
    validators: { onSubmit: schema },
    onSubmit: async ({ value }) => {
      setPending(true);
      try {
        await onSubmit(value as VendorInput);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Couldn't save the vendor.",
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
      data-testid="admin-vendor-form"
      onSubmit={(event) => {
        event.preventDefault();
        event.stopPropagation();
        form.handleSubmit();
      }}
    >
      <Card className="shadow-warm">
        <CardHeader>
          <CardTitle>Vendor details</CardTitle>
          <CardDescription>
            Who supplies these products, and how to reach them.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5 md:grid-cols-2">
          <form.Field name="name">
            {(field) => (
              <TextField
                field={field}
                label="Name"
                placeholder="Hyderabad Baby Depot"
                testId="admin-vendor-name"
              />
            )}
          </form.Field>

          <form.Field name="slug">
            {(field) => (
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <TextField
                    description="Internal reference slug."
                    field={field}
                    label="Slug"
                    placeholder="hyderabad-baby-depot"
                    testId="admin-vendor-slug"
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

          <form.Field name="type">
            {(field) => (
              <ControlField field={field} label="Type">
                <Select
                  onValueChange={(value) => field.handleChange(value as never)}
                  value={field.state.value}
                >
                  <SelectTrigger data-testid="admin-vendor-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {VENDOR_TYPE_OPTIONS.map((option) => (
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

          <form.Field name="contactName">
            {(field) => (
              <TextField
                description="Optional."
                field={field}
                label="Contact name"
              />
            )}
          </form.Field>

          <form.Field name="phone">
            {(field) => (
              <TextField description="Optional." field={field} label="Phone" />
            )}
          </form.Field>

          <form.Field name="email">
            {(field) => (
              <TextField
                description="Optional."
                field={field}
                label="Email"
                testId="admin-vendor-email"
              />
            )}
          </form.Field>

          <form.Field name="gstin">
            {(field) => (
              <TextField description="Optional." field={field} label="GSTIN" />
            )}
          </form.Field>

          <form.Field name="address">
            {(field) => (
              <div className="md:col-span-2">
                <TextField
                  description="Optional."
                  field={field}
                  label="Address"
                />
              </div>
            )}
          </form.Field>
        </CardContent>
      </Card>
    </form>
  );
});

export default VendorForm;
