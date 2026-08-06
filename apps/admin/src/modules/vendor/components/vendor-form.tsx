import { Button } from "@mumzo/ui/components/button";
import { Card, CardContent } from "@mumzo/ui/components/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@mumzo/ui/components/dialog";
import { FieldDescription, FieldLabel } from "@mumzo/ui/components/field";
import { cn } from "@mumzo/ui/lib/utils";
import { useForm } from "@tanstack/react-form";
import { Eye, Plus, Star, Trash2 } from "lucide-react";
import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import {
  NumberField,
  SelectField,
  TextareaField,
  TextField,
} from "@/core/components/form-fields";
import type { Vendor, VendorInput } from "../api/vendors-api";
import {
  PAYMENT_TERMS_LABEL,
  type PaymentTerms,
  VENDOR_TYPE_LABEL,
  type VendorType,
} from "../data/vendor-data";

const VENDOR_TYPE_OPTIONS = Object.entries(VENDOR_TYPE_LABEL).map(
  ([value, label]) => ({ value, label }),
);
const PAYMENT_TERMS_OPTIONS = Object.entries(PAYMENT_TERMS_LABEL).map(
  ([value, label]) => ({ value, label }),
);

const schema = z.object({
  name: z.string().min(1, "Give the vendor a name.").max(120),
  slug: z
    .string()
    .min(1, "Slug is required.")
    .max(120)
    .regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers and hyphens only."),
  type: z.enum(["manufacturer", "distributor", "retailer", "company", "other"]),
  contacts: z.array(
    z.object({
      name: z.string().min(1, "Give the contact a name."),
      phone: z.string().nullable(),
      email: z.string().nullable(),
      isPrimary: z.boolean(),
    }),
  ),
  address: z.string().nullable(),
  city: z.string().nullable(),
  state: z.string().nullable(),
  pincode: z.string().nullable(),
  lat: z.number().nullable(),
  lng: z.number().nullable(),
  gstin: z.string().nullable(),
  pan: z.string().nullable(),
  paymentTerms: z.enum([
    "prepaid",
    "cod",
    "net_7",
    "net_15",
    "net_30",
    "net_60",
  ]),
  defaultLeadTimeDays: z.number().nullable(),
  notes: z.string().nullable(),
  isActive: z.boolean(),
});

/** "Shree Supply Co." → "shree-supply-co". */
function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function emptyValues(): VendorInput {
  return {
    name: "",
    slug: "",
    type: "distributor",
    contacts: [{ name: "", phone: null, email: null, isPrimary: true }],
    address: null,
    city: null,
    state: null,
    pincode: null,
    lat: null,
    lng: null,
    gstin: null,
    pan: null,
    paymentTerms: "net_30",
    defaultLeadTimeDays: null,
    notes: null,
    isActive: true,
  };
}

function valuesFrom(vendor: Vendor): VendorInput {
  return {
    name: vendor.name,
    slug: vendor.slug,
    type: vendor.type,
    contacts:
      vendor.contacts.length > 0
        ? vendor.contacts
        : [{ name: "", phone: null, email: null, isPrimary: true }],
    address: vendor.address,
    city: vendor.city,
    state: vendor.state,
    pincode: vendor.pincode,
    lat: vendor.lat,
    lng: vendor.lng,
    gstin: vendor.gstin,
    pan: vendor.pan,
    paymentTerms: vendor.paymentTerms,
    defaultLeadTimeDays: vendor.defaultLeadTimeDays,
    notes: vendor.notes,
    isActive: vendor.isActive,
  };
}

const SECTIONS = [
  { id: "base", label: "Base", description: "Name, type and contacts." },
  { id: "location", label: "Location", description: "Address and geo." },
  { id: "terms", label: "Terms", description: "Payment and tax details." },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

export type VendorFormHandle = {
  submit: () => void;
  /** Current `isActive` value — read by the page header's toggle. */
  getIsActive: () => boolean;
  /** Stages an `isActive` change; only persisted on submit, like any other field. */
  setIsActive: (value: boolean) => void;
};

export const VendorForm = forwardRef<
  VendorFormHandle,
  {
    /** Present for edit; absent for create. */
    vendor?: Vendor;
    onSubmit: (values: VendorInput) => Promise<void>;
    onPendingChange?: (pending: boolean) => void;
    onIsActiveChange?: (isActive: boolean) => void;
  }
>(function VendorForm(
  { vendor, onSubmit, onPendingChange, onIsActiveChange },
  ref,
) {
  const [pending, setPending] = useState(false);
  const [activeSection, setActiveSection] = useState<SectionId>("base");

  const form = useForm({
    defaultValues: vendor
      ? { ...valuesFrom(vendor), isActive: vendor.isActive }
      : { ...emptyValues(), isActive: true },
    validators: { onSubmit: schema },
    onSubmit: async ({ value }) => {
      setPending(true);
      try {
        await onSubmit(value);
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
    getIsActive: () => form.getFieldValue("isActive"),
    setIsActive: (value: boolean) => {
      form.setFieldValue("isActive", value);
      onIsActiveChange?.(value);
    },
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
      <div className="grid gap-5 md:grid-cols-[240px_1fr]">
        <div className="flex flex-col gap-3">
          <nav
            aria-label="Vendor form sections"
            className="flex flex-col gap-1 rounded-2xl border border-border bg-card p-2 shadow-warm"
            data-testid="admin-vendor-form-nav"
          >
            {SECTIONS.map((section) => (
              <button
                className={cn(
                  "flex flex-col gap-0.5 rounded-xl px-4 py-3 text-left transition-colors",
                  activeSection === section.id
                    ? "bg-primary/10 text-primary"
                    : "text-foreground hover:bg-secondary",
                )}
                data-testid={`admin-vendor-section-${section.id}`}
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
                  data-testid="admin-vendor-preview-trigger"
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
                <DialogTitle>Vendor summary</DialogTitle>
              </DialogHeader>
              <form.Subscribe selector={(state) => state.values}>
                {(values) => (
                  <Card className="flex flex-col gap-2 p-5">
                    <p className="font-bold font-serif text-foreground text-lg leading-tight">
                      {values.name || "Vendor name"}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {VENDOR_TYPE_LABEL[values.type as VendorType]}
                      {values.city ? ` · ${values.city}` : ""}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {PAYMENT_TERMS_LABEL[values.paymentTerms as PaymentTerms]}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {values.isActive ? "Active" : "Inactive"}
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
                      placeholder="Shree Supply Co."
                      testId="admin-vendor-name"
                    />
                  )}
                </form.Field>

                <form.Field name="slug">
                  {(field) => (
                    <div className="flex items-end gap-2">
                      <div className="flex-1">
                        <TextField
                          description="Used as the vendor's internal identifier."
                          field={field}
                          label="Slug"
                          placeholder="shree-supply-co"
                          testId="admin-vendor-slug"
                        />
                      </div>
                      {vendor ? null : (
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

                <form.Field name="type">
                  {(field) => (
                    <SelectField
                      field={field}
                      label="Vendor type"
                      options={VENDOR_TYPE_OPTIONS}
                      testId="admin-vendor-type"
                    />
                  )}
                </form.Field>

                <div className="flex flex-col gap-3 md:col-span-2">
                  <FieldLabel>Contacts</FieldLabel>
                  <form.Field mode="array" name="contacts">
                    {(contactsField) => (
                      <div className="flex flex-col gap-3">
                        {contactsField.state.value.map((_, index) => (
                          <div
                            className="flex flex-col gap-3 rounded-xl border border-border p-3"
                            data-testid={`admin-vendor-contact-${index}`}
                            key={`contact-${
                              // biome-ignore lint/suspicious/noArrayIndexKey: contacts have no stable id until saved; array position is the identity while editing.
                              index
                            }`}
                          >
                            <div className="grid gap-3 sm:grid-cols-3">
                              <form.Field name={`contacts[${index}].name`}>
                                {(field) => (
                                  <TextField
                                    field={field}
                                    label="Name"
                                    placeholder="Ramesh Iyer"
                                    testId={`admin-vendor-contact-name-${index}`}
                                  />
                                )}
                              </form.Field>
                              <form.Field name={`contacts[${index}].phone`}>
                                {(field) => (
                                  <TextField
                                    field={field}
                                    label="Phone"
                                    placeholder="+91 98765 43210"
                                    testId={`admin-vendor-contact-phone-${index}`}
                                  />
                                )}
                              </form.Field>
                              <form.Field name={`contacts[${index}].email`}>
                                {(field) => (
                                  <TextField
                                    field={field}
                                    label="Email"
                                    placeholder="contact@vendor.com"
                                    testId={`admin-vendor-contact-email-${index}`}
                                    type="email"
                                  />
                                )}
                              </form.Field>
                            </div>
                            <div className="flex items-center justify-between">
                              <form.Field name={`contacts[${index}].isPrimary`}>
                                {(field) => (
                                  <button
                                    className={cn(
                                      "flex items-center gap-1.5 text-xs transition-colors",
                                      field.state.value
                                        ? "text-primary"
                                        : "text-muted-foreground hover:text-foreground",
                                    )}
                                    data-testid={`admin-vendor-contact-primary-${index}`}
                                    onClick={() => {
                                      // Only one primary contact at a time.
                                      for (
                                        let i = 0;
                                        i < contactsField.state.value.length;
                                        i++
                                      ) {
                                        form.setFieldValue(
                                          `contacts[${i}].isPrimary`,
                                          i === index,
                                        );
                                      }
                                    }}
                                    type="button"
                                  >
                                    <Star
                                      className="size-3.5"
                                      fill={
                                        field.state.value
                                          ? "currentColor"
                                          : "none"
                                      }
                                    />
                                    Primary contact
                                  </button>
                                )}
                              </form.Field>
                              {contactsField.state.value.length > 1 ? (
                                <Button
                                  className="text-muted-foreground hover:text-destructive"
                                  data-testid={`admin-vendor-contact-remove-${index}`}
                                  onClick={() =>
                                    contactsField.removeValue(index)
                                  }
                                  size="sm"
                                  type="button"
                                  variant="ghost"
                                >
                                  <Trash2 data-icon="inline-start" />
                                  Remove
                                </Button>
                              ) : null}
                            </div>
                          </div>
                        ))}

                        <Button
                          className="self-start"
                          data-testid="admin-vendor-contact-add"
                          onClick={() =>
                            contactsField.pushValue({
                              name: "",
                              phone: null,
                              email: null,
                              isPrimary: false,
                            })
                          }
                          size="sm"
                          type="button"
                          variant="outline"
                        >
                          <Plus data-icon="inline-start" />
                          Add contact
                        </Button>
                      </div>
                    )}
                  </form.Field>
                  <FieldDescription>
                    The primary contact is used for order/PO communication.
                  </FieldDescription>
                </div>
              </>
            ) : null}

            {activeSection === "location" ? (
              <>
                <div className="md:col-span-2">
                  <form.Field name="address">
                    {(field) => (
                      <TextareaField
                        field={field}
                        label="Address"
                        rows={3}
                        testId="admin-vendor-address"
                      />
                    )}
                  </form.Field>
                </div>

                <form.Field name="city">
                  {(field) => (
                    <TextField
                      field={field}
                      label="City"
                      placeholder="Hyderabad"
                      testId="admin-vendor-city"
                    />
                  )}
                </form.Field>

                <form.Field name="state">
                  {(field) => (
                    <TextField
                      field={field}
                      label="State"
                      placeholder="Telangana"
                      testId="admin-vendor-state"
                    />
                  )}
                </form.Field>

                <form.Field name="pincode">
                  {(field) => (
                    <TextField
                      field={field}
                      label="Pincode"
                      placeholder="500032"
                      testId="admin-vendor-pincode"
                    />
                  )}
                </form.Field>

                <div className="grid grid-cols-2 gap-3">
                  <form.Field name="lat">
                    {(field) => (
                      <NumberField
                        field={field}
                        label="Latitude"
                        testId="admin-vendor-lat"
                      />
                    )}
                  </form.Field>
                  <form.Field name="lng">
                    {(field) => (
                      <NumberField
                        field={field}
                        label="Longitude"
                        testId="admin-vendor-lng"
                      />
                    )}
                  </form.Field>
                </div>
              </>
            ) : null}

            {activeSection === "terms" ? (
              <>
                <form.Field name="paymentTerms">
                  {(field) => (
                    <SelectField
                      field={field}
                      label="Payment terms"
                      options={PAYMENT_TERMS_OPTIONS}
                      testId="admin-vendor-payment-terms"
                    />
                  )}
                </form.Field>

                <form.Field name="defaultLeadTimeDays">
                  {(field) => (
                    <NumberField
                      description="Typical days from PO to delivery."
                      field={field}
                      label="Default lead time (days)"
                      testId="admin-vendor-lead-time"
                    />
                  )}
                </form.Field>

                <form.Field name="gstin">
                  {(field) => (
                    <TextField
                      field={field}
                      label="GSTIN"
                      placeholder="36AAACS1234E1Z5"
                      testId="admin-vendor-gstin"
                    />
                  )}
                </form.Field>

                <form.Field name="pan">
                  {(field) => (
                    <TextField
                      field={field}
                      label="PAN"
                      placeholder="AAACS1234E"
                      testId="admin-vendor-pan"
                    />
                  )}
                </form.Field>

                <div className="md:col-span-2">
                  <form.Field name="notes">
                    {(field) => (
                      <TextareaField
                        field={field}
                        label="Notes"
                        rows={3}
                        testId="admin-vendor-notes"
                      />
                    )}
                  </form.Field>
                </div>
              </>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </form>
  );
});

export default VendorForm;
