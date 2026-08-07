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
import { cn } from "@mumzo/ui/lib/utils";
import { useForm } from "@tanstack/react-form";
import { useQuery } from "@tanstack/react-query";
import { Calendar, Layers, Percent, Sliders, Tag } from "lucide-react";
import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import {
  ControlField,
  NumberField,
  TextareaField,
  TextField,
} from "@/core/components/form-fields";
import StringListEditor from "@/core/components/string-list-editor";
import { brandsAllQueryOptions } from "@/modules/brand";
import { categoriesQueryOptions } from "@/modules/category";
import type { Coupon, CouponInput } from "../api/coupons-api";
import { PRODUCT_SCOPE_OPTIONS, VISIBILITY_OPTIONS } from "../data/coupon-data";

const schema = z
  .object({
    code: z
      .string()
      .min(3, "At least 3 characters.")
      .max(40)
      .regex(/^[A-Za-z0-9]+$/, "Letters and numbers only."),
    description: z.string().max(500).nullable(),
    type: z.enum(["flat", "pct"]),
    value: z.number().int().positive("Must be more than zero."),
    cap: z.number().int().positive().nullable(),
    minAmt: z.number().int().min(0),
    categorySlug: z.string().nullable(),
    brandId: z.string().nullable(),
    productScope: z.enum(["all", "specific"]),
    productIds: z.array(z.string()),
    visibility: z.enum(["public", "assigned"]),
    assignedUserIds: z.array(z.string()),
    segment: z.string().max(60).nullable(),
    firstOrderOnly: z.boolean(),
    maxUses: z.number().int().positive().nullable(),
    maxUsesPerUser: z.number().int().positive().nullable(),
    isStackable: z.boolean(),
    priority: z.number().int(),
    expiresAt: z.string().min(1, "Set an expiry."),
    startsAt: z.string().nullable(),
    isActive: z.boolean(),
    isGlobal: z.boolean(),
  })
  .refine((data) => data.type !== "pct" || data.value <= 100, {
    message: "A percentage coupon can't exceed 100.",
    path: ["value"],
  })
  .refine(
    (data) => data.productScope !== "specific" || data.productIds.length > 0,
    {
      message: "Pick at least one product.",
      path: ["productIds"],
    },
  )
  .refine(
    (data) => data.visibility !== "assigned" || data.assignedUserIds.length > 0,
    {
      message: "Add at least one customer id.",
      path: ["assignedUserIds"],
    },
  );

type FormValues = z.infer<typeof schema>;

/** Converts an ISO string to the `datetime-local` input's local-time value. */
function toLocalInput(iso: string | null): string {
  if (!iso) {
    return "";
  }
  const date = new Date(iso);
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}

function emptyValues(): FormValues {
  return {
    code: "",
    description: null,
    type: "flat",
    value: 0,
    cap: null,
    minAmt: 0,
    categorySlug: null,
    brandId: null,
    productScope: "all",
    productIds: [],
    visibility: "public",
    assignedUserIds: [],
    segment: null,
    firstOrderOnly: false,
    maxUses: null,
    maxUsesPerUser: null,
    isStackable: false,
    priority: 0,
    expiresAt: "",
    startsAt: null,
    isActive: true,
    isGlobal: false,
  };
}

function valuesFrom(coupon: Coupon): FormValues {
  return {
    code: coupon.code,
    description: coupon.description,
    type: coupon.type,
    value: coupon.value,
    cap: coupon.cap,
    minAmt: coupon.minAmt,
    categorySlug: coupon.categorySlug,
    brandId: coupon.brandId,
    productScope: coupon.productScope,
    productIds: coupon.productIds,
    visibility: coupon.visibility,
    assignedUserIds: coupon.assignedUserIds,
    segment: coupon.segment,
    firstOrderOnly: coupon.firstOrderOnly,
    maxUses: coupon.maxUses,
    maxUsesPerUser: coupon.maxUsesPerUser,
    isStackable: coupon.isStackable,
    priority: coupon.priority,
    expiresAt: toLocalInput(coupon.expiresAt),
    startsAt: toLocalInput(coupon.startsAt),
    isActive: coupon.isActive,
    isGlobal: coupon.isGlobal,
  };
}

export type CouponFormHandle = {
  submit: () => void;
};

/** Imperative handle so a page can trigger submit from outside the form tree (e.g. a PageHeader action). */
export const CouponForm = forwardRef<
  CouponFormHandle,
  {
    /** Present for edit; absent for create. */
    coupon?: Coupon;
    onSubmit: (values: CouponInput) => Promise<void>;
    onPendingChange?: (pending: boolean) => void;
  }
>(function CouponForm({ coupon, onSubmit, onPendingChange }, ref) {
  const [pending, setPending] = useState(false);
  const { data: categories } = useQuery(categoriesQueryOptions);
  const { data: brands } = useQuery(brandsAllQueryOptions);

  const form = useForm({
    defaultValues: coupon ? valuesFrom(coupon) : emptyValues(),
    validators: { onSubmit: schema },
    onSubmit: async ({ value }) => {
      setPending(true);
      try {
        await onSubmit({
          ...value,
          expiresAt: new Date(value.expiresAt).toISOString(),
          startsAt: value.startsAt
            ? new Date(value.startsAt).toISOString()
            : null,
        });
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Couldn't save the coupon.",
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

  const TABS = [
    { id: "general", label: "General Info", icon: Tag },
    { id: "discount", label: "Discount Rules", icon: Percent },
    { id: "scope", label: "Scope & Targeting", icon: Sliders },
    { id: "limits", label: "Limits & Stacking", icon: Layers },
    { id: "availability", label: "Availability", icon: Calendar },
  ] as const;

  const [activeTab, setActiveTab] = useState<
    "general" | "discount" | "scope" | "limits" | "availability"
  >("general");

  return (
    <form
      data-testid="admin-coupon-form"
      onSubmit={(event) => {
        event.preventDefault();
        event.stopPropagation();
        form.handleSubmit();
      }}
    >
      <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-[240px_1fr]">
        {/* Left sidebar nav */}
        <div className="flex flex-col gap-1 rounded-2xl border border-border/60 bg-white p-3 shadow-warm">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-xl px-4 py-2.5 text-left font-semibold text-sm transition-all",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-foreground/70 hover:bg-secondary hover:text-foreground",
                )}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Right side form content */}
        <div className="flex flex-col gap-6">
          {activeTab === "general" && (
            <Card className="shadow-warm">
              <CardHeader>
                <CardTitle>General Info</CardTitle>
                <CardDescription>
                  The code, description, and status of the coupon.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-5 md:grid-cols-2">
                <form.Field name="code">
                  {(field) => (
                    <TextField
                      field={field}
                      label="Code"
                      placeholder="MUMZO100"
                      testId="admin-coupon-code"
                    />
                  )}
                </form.Field>

                <form.Field name="isActive">
                  {(field) => (
                    <Field orientation="horizontal" className="pt-2">
                      <FieldLabel htmlFor={field.name}>Active</FieldLabel>
                      <Switch
                        checked={field.state.value}
                        id={field.name}
                        onCheckedChange={(checked) =>
                          field.handleChange(checked)
                        }
                      />
                    </Field>
                  )}
                </form.Field>

                <form.Field name="isGlobal">
                  {(field) => (
                    <Field orientation="horizontal" className="pt-2">
                      <FieldLabel htmlFor={field.name}>
                        Show on Storefront (Global)
                      </FieldLabel>
                      <Switch
                        checked={field.state.value}
                        id={field.name}
                        onCheckedChange={(checked) =>
                          field.handleChange(checked)
                        }
                      />
                    </Field>
                  )}
                </form.Field>

                <form.Field name="description">
                  {(field) => (
                    <div className="md:col-span-2">
                      <TextareaField
                        field={field}
                        label="Description"
                        rows={3}
                      />
                    </div>
                  )}
                </form.Field>
              </CardContent>
            </Card>
          )}

          {activeTab === "discount" && (
            <Card className="shadow-warm">
              <CardHeader>
                <CardTitle>Discount Rules</CardTitle>
                <CardDescription>
                  Value settings and application requirements.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-5 md:grid-cols-2">
                <form.Field name="type">
                  {(field) => (
                    <ControlField field={field} label="Type">
                      <Select
                        onValueChange={(value) =>
                          field.handleChange(value as never)
                        }
                        value={field.state.value}
                      >
                        <SelectTrigger data-testid="admin-coupon-type">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectItem value="flat">Flat (₹)</SelectItem>
                            <SelectItem value="pct">Percentage (%)</SelectItem>
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </ControlField>
                  )}
                </form.Field>

                <form.Field name="value">
                  {(field) => (
                    <NumberField
                      field={field}
                      label="Value"
                      testId="admin-coupon-value"
                    />
                  )}
                </form.Field>

                <form.Field name="cap">
                  {(field) => (
                    <NumberField
                      description="Max discount for a percentage coupon. Leave blank for uncapped."
                      field={field}
                      label="Cap ₹"
                    />
                  )}
                </form.Field>

                <form.Field name="minAmt">
                  {(field) => (
                    <NumberField
                      field={field}
                      label="Minimum cart total ₹"
                      testId="admin-coupon-minamt"
                    />
                  )}
                </form.Field>
              </CardContent>
            </Card>
          )}

          {activeTab === "scope" && (
            <Card className="shadow-warm">
              <CardHeader>
                <CardTitle>Scope & Targeting</CardTitle>
                <CardDescription>
                  Restrict the coupon to specific users, brands, categories, or
                  products.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-5 md:grid-cols-2">
                <form.Field name="categorySlug">
                  {(field) => (
                    <ControlField field={field} label="Category">
                      <Select
                        onValueChange={(value) =>
                          field.handleChange(value === "none" ? null : value)
                        }
                        value={field.state.value ?? "none"}
                      >
                        <SelectTrigger data-testid="admin-coupon-category">
                          <SelectValue placeholder="Any category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectItem value="none">Any category</SelectItem>
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

                <form.Field name="brandId">
                  {(field) => (
                    <ControlField field={field} label="Brand">
                      <Select
                        onValueChange={(value) =>
                          field.handleChange(value === "none" ? null : value)
                        }
                        value={field.state.value ?? "none"}
                      >
                        <SelectTrigger data-testid="admin-coupon-brand">
                          <SelectValue placeholder="Any brand" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectItem value="none">Any brand</SelectItem>
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

                <form.Field name="segment">
                  {(field) => (
                    <TextField
                      description="Optional free-text tag, e.g. first_time, vip."
                      field={field}
                      label="Segment"
                    />
                  )}
                </form.Field>

                <form.Field name="firstOrderOnly">
                  {(field) => (
                    <Field orientation="horizontal">
                      <FieldLabel htmlFor={field.name}>
                        First order only
                      </FieldLabel>
                      <Switch
                        checked={field.state.value}
                        id={field.name}
                        onCheckedChange={(checked) =>
                          field.handleChange(checked)
                        }
                      />
                    </Field>
                  )}
                </form.Field>

                <form.Field name="productScope">
                  {(field) => (
                    <ControlField field={field} label="Products">
                      <Select
                        onValueChange={(value) =>
                          field.handleChange(value as never)
                        }
                        value={field.state.value}
                      >
                        <SelectTrigger data-testid="admin-coupon-product-scope">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            {PRODUCT_SCOPE_OPTIONS.map((option) => (
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

                <form.Field name="visibility">
                  {(field) => (
                    <ControlField field={field} label="Visibility">
                      <Select
                        onValueChange={(value) =>
                          field.handleChange(value as never)
                        }
                        value={field.state.value}
                      >
                        <SelectTrigger data-testid="admin-coupon-visibility">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            {VISIBILITY_OPTIONS.map((option) => (
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

                <form.Subscribe selector={(state) => state.values.productScope}>
                  {(productScope) =>
                    productScope === "specific" ? (
                      <form.Field mode="array" name="productIds">
                        {(field) => (
                          <div className="md:col-span-2">
                            <ControlField
                              description="Product ids this coupon is scoped to."
                              field={field}
                              label="Scoped products"
                            >
                              <StringListEditor
                                addLabel="Add product id"
                                onChange={(next) => field.handleChange(next)}
                                testId="admin-coupon-products"
                                value={field.state.value ?? []}
                              />
                            </ControlField>
                          </div>
                        )}
                      </form.Field>
                    ) : null
                  }
                </form.Subscribe>

                <form.Subscribe selector={(state) => state.values.visibility}>
                  {(visibility) =>
                    visibility === "assigned" ? (
                      <form.Field mode="array" name="assignedUserIds">
                        {(field) => (
                          <div className="md:col-span-2">
                            <ControlField
                              description="Customer ids allowed to use this coupon."
                              field={field}
                              label="Assigned customers"
                            >
                              <StringListEditor
                                addLabel="Add customer id"
                                onChange={(next) => field.handleChange(next)}
                                testId="admin-coupon-assigned"
                                value={field.state.value ?? []}
                              />
                            </ControlField>
                          </div>
                        )}
                      </form.Field>
                    ) : null
                  }
                </form.Subscribe>
              </CardContent>
            </Card>
          )}

          {activeTab === "limits" && (
            <Card className="shadow-warm">
              <CardHeader>
                <CardTitle>Limits & Stacking</CardTitle>
                <CardDescription>
                  Redemption constraints and stacking rules.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-5 md:grid-cols-2">
                <form.Field name="maxUses">
                  {(field) => (
                    <NumberField
                      description="Total redemptions across every customer. Leave blank for uncapped."
                      field={field}
                      label="Max uses"
                    />
                  )}
                </form.Field>

                <form.Field name="maxUsesPerUser">
                  {(field) => (
                    <NumberField
                      description="Maximum times a single customer can redeem this coupon."
                      field={field}
                      label="Max uses per customer"
                    />
                  )}
                </form.Field>

                <form.Field name="isStackable">
                  {(field) => (
                    <Field orientation="horizontal">
                      <FieldLabel htmlFor={field.name}>
                        Stackable with other coupons
                      </FieldLabel>
                      <Switch
                        checked={field.state.value}
                        id={field.name}
                        onCheckedChange={(checked) =>
                          field.handleChange(checked)
                        }
                      />
                    </Field>
                  )}
                </form.Field>

                <form.Field name="priority">
                  {(field) => (
                    <NumberField
                      description="Higher wins when multiple non-stackable coupons could apply."
                      field={field}
                      label="Priority"
                    />
                  )}
                </form.Field>
              </CardContent>
            </Card>
          )}

          {activeTab === "availability" && (
            <Card className="shadow-warm">
              <CardHeader>
                <CardTitle>Availability Dates</CardTitle>
                <CardDescription>
                  Define when this coupon is active.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-5 md:grid-cols-2">
                <form.Field name="startsAt">
                  {(field) => {
                    const invalid = field.state.meta.errors.length > 0;
                    return (
                      <Field data-invalid={invalid || undefined}>
                        <FieldLabel htmlFor={field.name}>
                          Starts (optional)
                        </FieldLabel>
                        <input
                          className="flex h-10 rounded-xl border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50"
                          id={field.name}
                          onChange={(event) =>
                            field.handleChange(event.target.value || null)
                          }
                          type="datetime-local"
                          value={field.state.value ?? ""}
                        />
                      </Field>
                    );
                  }}
                </form.Field>

                <form.Field name="expiresAt">
                  {(field) => {
                    const invalid = field.state.meta.errors.length > 0;
                    return (
                      <Field data-invalid={invalid || undefined}>
                        <FieldLabel htmlFor={field.name}>Expires</FieldLabel>
                        <input
                          className="flex h-10 rounded-xl border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50"
                          data-testid="admin-coupon-expires"
                          id={field.name}
                          onChange={(event) =>
                            field.handleChange(event.target.value)
                          }
                          type="datetime-local"
                          value={field.state.value}
                        />
                      </Field>
                    );
                  }}
                </form.Field>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </form>
  );
});

export default CouponForm;
