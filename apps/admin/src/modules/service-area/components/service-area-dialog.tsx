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
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@mumzo/ui/components/field";
import { Input } from "@mumzo/ui/components/input";
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
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { queryKeys } from "@/core/api/query-keys";
import { hubsQueryOptions } from "@/modules/hub";
import {
  createServiceArea,
  type ServiceArea,
  updateServiceArea,
} from "../api/service-areas-api";

const schema = z.object({
  name: z.string().min(1, "Give the area a name.").max(120),
  pincode: z.string().regex(/^\d{6}$/, "Enter a 6-digit pincode."),
  hubId: z.string().min(1, "Choose which hub serves this area."),
  isActive: z.boolean(),
});

/** Create when `serviceArea` is absent, edit in place when it's supplied. */
export function ServiceAreaDialog({
  serviceArea,
}: {
  serviceArea?: ServiceArea;
}) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const isEdit = Boolean(serviceArea);
  const { data: hubs } = useQuery(hubsQueryOptions);

  const mutation = useMutation({
    mutationFn: async (value: z.infer<typeof schema>) => {
      if (serviceArea) {
        await updateServiceArea(serviceArea.id, value);
        return;
      }
      await createServiceArea(value);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.serviceAreas.all,
      });
      toast.success(isEdit ? "Service area updated." : "Service area added.");
      setOpen(false);
      if (!isEdit) {
        form.reset();
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "Could not save the service area.");
    },
  });

  const form = useForm({
    defaultValues: {
      name: serviceArea?.name ?? "",
      pincode: serviceArea?.pincode ?? "",
      hubId: serviceArea?.hubId ?? "",
      isActive: serviceArea?.isActive ?? true,
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
            <Button data-testid="create-service-area" />
          )
        }
      >
        {isEdit ? (
          "Edit"
        ) : (
          <>
            <Plus data-icon="inline-start" />
            New service area
          </>
        )}
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit service area" : "Add a service area"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update which hub serves this pincode."
              : "Map a pincode to the hub that delivers there."}
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
                    <FieldLabel htmlFor={field.name}>Area name</FieldLabel>
                    <Input
                      aria-invalid={invalid || undefined}
                      data-testid="service-area-name"
                      id={field.name}
                      onBlur={field.handleBlur}
                      onChange={(event) =>
                        field.handleChange(event.target.value)
                      }
                      placeholder="Banjara Hills"
                      value={field.state.value}
                    />
                    {invalid ? (
                      <FieldError errors={field.state.meta.errors} />
                    ) : null}
                  </Field>
                );
              }}
            </form.Field>

            <form.Field name="pincode">
              {(field) => {
                const invalid = field.state.meta.errors.length > 0;
                return (
                  <Field data-invalid={invalid || undefined}>
                    <FieldLabel htmlFor={field.name}>Pincode</FieldLabel>
                    <Input
                      aria-invalid={invalid || undefined}
                      data-testid="service-area-pincode"
                      id={field.name}
                      inputMode="numeric"
                      onBlur={field.handleBlur}
                      onChange={(event) =>
                        field.handleChange(event.target.value)
                      }
                      placeholder="500034"
                      value={field.state.value}
                    />
                    {invalid ? (
                      <FieldError errors={field.state.meta.errors} />
                    ) : null}
                  </Field>
                );
              }}
            </form.Field>

            <form.Field name="hubId">
              {(field) => {
                const invalid = field.state.meta.errors.length > 0;
                return (
                  <Field data-invalid={invalid || undefined}>
                    <FieldLabel htmlFor={field.name}>Hub</FieldLabel>
                    <Select
                      value={field.state.value}
                      onValueChange={(value) =>
                        field.handleChange(String(value))
                      }
                    >
                      <SelectTrigger
                        className="border-border bg-card"
                        data-testid="service-area-hub"
                        id={field.name}
                      >
                        <SelectValue placeholder="Select a hub" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {(hubs ?? []).map((hub) => (
                            <SelectItem key={hub.id} value={hub.id}>
                              {hub.name}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
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
              data-testid="submit-service-area"
              disabled={mutation.isPending}
              type="submit"
            >
              {mutation.isPending
                ? "Saving…"
                : isEdit
                  ? "Save changes"
                  : "Add service area"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default ServiceAreaDialog;
