import { Button } from "@mumzo/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@mumzo/ui/components/dialog";
import { useForm } from "@tanstack/react-form";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";
import { SelectField, TextField } from "@/core/components/form-fields";
import { hubsAllQueryOptions } from "@/modules/hub";
import type { ServiceArea, ServiceAreaInput } from "../api/service-areas-api";

const schema = z.object({
  name: z.string().min(1, "Give the area a name.").max(120),
  pincode: z.string().regex(/^\d{6}$/, "Pincode must be 6 digits."),
  hubId: z.string().min(1, "Choose the hub that serves this pincode."),
  isActive: z.boolean(),
});

function emptyValues(): ServiceAreaInput {
  return { name: "", pincode: "", hubId: "", isActive: true };
}

function valuesFrom(area: ServiceArea): ServiceAreaInput {
  return {
    name: area.name,
    pincode: area.pincode,
    hubId: area.hubId,
    isActive: area.isActive,
  };
}

export function ServiceAreaForm({
  open,
  onOpenChange,
  area,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Present for edit; absent for create. */
  area?: ServiceArea;
  onSubmit: (values: ServiceAreaInput) => Promise<void>;
}) {
  const { data: hubs = [] } = useQuery(hubsAllQueryOptions);
  const hubOptions = hubs.map((hub) => ({ value: hub.id, label: hub.name }));

  const form = useForm({
    defaultValues: area ? valuesFrom(area) : emptyValues(),
    validators: { onSubmit: schema },
    onSubmit: async ({ value }) => {
      try {
        await onSubmit(value);
        onOpenChange(false);
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Could not save the service area.",
        );
      }
    },
  });

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {area ? "Edit service area" : "Add service area"}
          </DialogTitle>
        </DialogHeader>
        <form
          data-testid="admin-service-area-form"
          onSubmit={(event) => {
            event.preventDefault();
            event.stopPropagation();
            form.handleSubmit();
          }}
        >
          <div className="flex flex-col gap-4">
            <form.Field name="name">
              {(field) => (
                <TextField
                  field={field}
                  label="Area name"
                  placeholder="Banjara Hills"
                  testId="admin-service-area-name"
                />
              )}
            </form.Field>

            <form.Field name="pincode">
              {(field) => (
                <TextField
                  field={field}
                  label="Pincode"
                  placeholder="500034"
                  testId="admin-service-area-pincode"
                />
              )}
            </form.Field>

            <form.Field name="hubId">
              {(field) => (
                <SelectField
                  field={field}
                  label="Hub"
                  options={hubOptions}
                  placeholder="Choose a hub…"
                  testId="admin-service-area-hub"
                />
              )}
            </form.Field>
          </div>

          <DialogFooter className="mt-6">
            <Button
              onClick={() => onOpenChange(false)}
              type="button"
              variant="outline"
            >
              Cancel
            </Button>
            <form.Subscribe selector={(state) => state.isSubmitting}>
              {(isSubmitting) => (
                <Button
                  data-testid="admin-service-area-save"
                  disabled={isSubmitting}
                  type="submit"
                >
                  {isSubmitting
                    ? "Saving…"
                    : area
                      ? "Save changes"
                      : "Add service area"}
                </Button>
              )}
            </form.Subscribe>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default ServiceAreaForm;
