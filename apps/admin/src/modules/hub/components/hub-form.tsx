import { Button } from "@mumzo/ui/components/button";
import { Card, CardContent } from "@mumzo/ui/components/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@mumzo/ui/components/dialog";
import { cn } from "@mumzo/ui/lib/utils";
import { useForm } from "@tanstack/react-form";
import { Eye } from "lucide-react";
import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import {
  NumberField,
  SelectField,
  TextField,
} from "@/core/components/form-fields";
import type { Hub, HubInput } from "../api/hubs-api";
import { HUB_TYPE_LABEL, type HubType } from "../data/hub-data";
import { HubLocationPicker } from "./hub-location-picker";

const HUB_TYPE_OPTIONS = Object.entries(HUB_TYPE_LABEL).map(
  ([value, label]) => ({ value, label }),
);

const schema = z.object({
  name: z.string().min(1, "Give the hub a name.").max(120),
  type: z.enum(["dark_store", "micro_warehouse", "fulfilment_center"]),
  address: z.string().min(1, "Address is required.").max(300),
  city: z.string().nullable(),
  state: z.string().nullable(),
  pincode: z.string().nullable(),
  lat: z.number().min(-90).max(90).nullable(),
  lng: z.number().min(-180).max(180).nullable(),
  contactName: z.string().nullable(),
  contactPhone: z.string().nullable(),
  capacity: z.number().nullable(),
  operatingHoursStart: z.string().nullable(),
  operatingHoursEnd: z.string().nullable(),
  avgPickPackMins: z.number(),
  serviceRadiusKm: z.number().positive(),
  isActive: z.boolean(),
  isDefault: z.boolean(),
});

function emptyValues(): HubInput {
  return {
    name: "",
    type: "dark_store",
    address: "",
    city: null,
    state: null,
    pincode: null,
    lat: null,
    lng: null,
    contactName: null,
    contactPhone: null,
    capacity: null,
    operatingHoursStart: null,
    operatingHoursEnd: null,
    avgPickPackMins: 3,
    serviceRadiusKm: 5,
    isActive: true,
    isDefault: false,
  };
}

function valuesFrom(hub: Hub): HubInput {
  return {
    name: hub.name,
    type: hub.type,
    address: hub.address,
    city: hub.city,
    state: hub.state,
    pincode: hub.pincode,
    lat: hub.lat,
    lng: hub.lng,
    contactName: hub.contactName,
    contactPhone: hub.contactPhone,
    capacity: hub.capacity,
    operatingHoursStart: hub.operatingHoursStart,
    operatingHoursEnd: hub.operatingHoursEnd,
    avgPickPackMins: hub.avgPickPackMins,
    serviceRadiusKm: hub.serviceRadiusKm,
    isActive: hub.isActive,
    isDefault: hub.isDefault,
  };
}

const SECTIONS = [
  { id: "base", label: "Base", description: "Name, type and address." },
  {
    id: "operations",
    label: "Operations",
    description: "Contact and capacity.",
  },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

export type HubFormHandle = {
  submit: () => void;
  getIsActive: () => boolean;
  setIsActive: (value: boolean) => void;
  getIsDefault: () => boolean;
  setIsDefault: (value: boolean) => void;
};

export const HubForm = forwardRef<
  HubFormHandle,
  {
    /** Present for edit; absent for create. */
    hub?: Hub;
    onSubmit: (values: HubInput) => Promise<void>;
    onPendingChange?: (pending: boolean) => void;
    onIsActiveChange?: (isActive: boolean) => void;
    onIsDefaultChange?: (isDefault: boolean) => void;
  }
>(function HubForm(
  { hub, onSubmit, onPendingChange, onIsActiveChange, onIsDefaultChange },
  ref,
) {
  const [pending, setPending] = useState(false);
  const [activeSection, setActiveSection] = useState<SectionId>("base");

  const form = useForm({
    defaultValues: hub ? valuesFrom(hub) : emptyValues(),
    validators: { onSubmit: schema },
    onSubmit: async ({ value }) => {
      setPending(true);
      try {
        await onSubmit(value);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Couldn't save the hub.",
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
    getIsDefault: () => form.getFieldValue("isDefault"),
    setIsDefault: (value: boolean) => {
      form.setFieldValue("isDefault", value);
      onIsDefaultChange?.(value);
    },
  }));

  return (
    <form
      data-testid="admin-hub-form"
      onSubmit={(event) => {
        event.preventDefault();
        event.stopPropagation();
        form.handleSubmit();
      }}
    >
      <div className="grid gap-5 md:grid-cols-[240px_1fr]">
        <div className="flex flex-col gap-3">
          <nav
            aria-label="Hub form sections"
            className="flex flex-col gap-1 rounded-2xl border border-border bg-card p-2 shadow-warm"
            data-testid="admin-hub-form-nav"
          >
            {SECTIONS.map((section) => (
              <button
                className={cn(
                  "flex flex-col gap-0.5 rounded-xl px-4 py-3 text-left transition-colors",
                  activeSection === section.id
                    ? "bg-primary/10 text-primary"
                    : "text-foreground hover:bg-secondary",
                )}
                data-testid={`admin-hub-section-${section.id}`}
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
                  data-testid="admin-hub-preview-trigger"
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
                <DialogTitle>Hub summary</DialogTitle>
              </DialogHeader>
              <form.Subscribe selector={(state) => state.values}>
                {(values) => (
                  <Card className="flex flex-col gap-2 p-5">
                    <p className="font-bold font-serif text-foreground text-lg leading-tight">
                      {values.name || "Hub name"}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {HUB_TYPE_LABEL[values.type as HubType]}
                      {values.city ? ` · ${values.city}` : ""}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {values.isActive ? "Active" : "Inactive"}
                      {values.isDefault ? " · Default hub" : ""}
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
                      placeholder="Gachibowli Dark Store"
                      testId="admin-hub-name"
                    />
                  )}
                </form.Field>

                <form.Field name="type">
                  {(field) => (
                    <SelectField
                      field={field}
                      label="Hub type"
                      options={HUB_TYPE_OPTIONS}
                      testId="admin-hub-type"
                    />
                  )}
                </form.Field>

                <div className="md:col-span-2">
                  <form.Field name="address">
                    {(field) => (
                      <TextField
                        field={field}
                        label="Address"
                        placeholder="Plot 9, Financial District"
                        testId="admin-hub-address"
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
                      testId="admin-hub-city"
                    />
                  )}
                </form.Field>

                <form.Field name="state">
                  {(field) => (
                    <TextField
                      field={field}
                      label="State"
                      placeholder="Telangana"
                      testId="admin-hub-state"
                    />
                  )}
                </form.Field>

                <form.Field name="pincode">
                  {(field) => (
                    <TextField
                      field={field}
                      label="Pincode"
                      placeholder="500032"
                      testId="admin-hub-pincode"
                    />
                  )}
                </form.Field>

                <form.Subscribe
                  selector={(state) => [
                    state.values.lat,
                    state.values.lng,
                    state.values.serviceRadiusKm,
                    state.values.pincode,
                  ]}
                >
                  {([lat, lng, serviceRadiusKm, pincode]) => (
                    <HubLocationPicker
                      lat={lat as number | null}
                      lng={lng as number | null}
                      onChange={({ lat: nextLat, lng: nextLng }) => {
                        form.setFieldValue("lat", nextLat);
                        form.setFieldValue("lng", nextLng);
                      }}
                      pincode={pincode as string | null}
                      radiusKm={serviceRadiusKm as number}
                    />
                  )}
                </form.Subscribe>

                <div className="grid grid-cols-2 gap-3 md:col-span-2">
                  <form.Field name="lat">
                    {(field) => (
                      <NumberField
                        field={field}
                        label="Latitude"
                        testId="admin-hub-lat"
                      />
                    )}
                  </form.Field>
                  <form.Field name="lng">
                    {(field) => (
                      <NumberField
                        field={field}
                        label="Longitude"
                        testId="admin-hub-lng"
                      />
                    )}
                  </form.Field>
                </div>
              </>
            ) : null}

            {activeSection === "operations" ? (
              <>
                <form.Field name="contactName">
                  {(field) => (
                    <TextField
                      field={field}
                      label="Contact name"
                      placeholder="Farhan Ali"
                      testId="admin-hub-contact-name"
                    />
                  )}
                </form.Field>

                <form.Field name="contactPhone">
                  {(field) => (
                    <TextField
                      field={field}
                      label="Contact phone"
                      placeholder="+91 90100 22334"
                      testId="admin-hub-contact-phone"
                    />
                  )}
                </form.Field>

                <form.Field name="capacity">
                  {(field) => (
                    <NumberField
                      description="Approximate SKU/unit capacity."
                      field={field}
                      label="Capacity"
                      testId="admin-hub-capacity"
                    />
                  )}
                </form.Field>

                <form.Field name="avgPickPackMins">
                  {(field) => (
                    <NumberField
                      description="Average time to pick and pack an order."
                      field={field}
                      label="Avg pick-pack (mins)"
                      testId="admin-hub-pick-pack-mins"
                    />
                  )}
                </form.Field>

                <form.Field name="serviceRadiusKm">
                  {(field) => (
                    <NumberField
                      description="Delivery coverage radius shown on the hub map."
                      field={field}
                      label="Service radius (km)"
                      testId="admin-hub-radius"
                    />
                  )}
                </form.Field>

                <form.Field name="operatingHoursStart">
                  {(field) => (
                    <TextField
                      field={field}
                      label="Opens at"
                      placeholder="06:00"
                      testId="admin-hub-hours-start"
                    />
                  )}
                </form.Field>

                <form.Field name="operatingHoursEnd">
                  {(field) => (
                    <TextField
                      field={field}
                      label="Closes at"
                      placeholder="23:00"
                      testId="admin-hub-hours-end"
                    />
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

export default HubForm;
