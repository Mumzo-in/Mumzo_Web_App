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
import { Switch } from "@mumzo/ui/components/switch";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { queryKeys } from "@/core/api/query-keys";
import { createHub, type Hub, updateHub } from "../api/hubs-api";

const schema = z.object({
  name: z.string().min(1, "Give the hub a name.").max(120),
  address: z.string().min(1, "Address is required.").max(300),
  lat: z.number().min(-90).max(90).nullable(),
  lng: z.number().min(-180).max(180).nullable(),
  isActive: z.boolean(),
});

/** Create when `hub` is absent, edit in place when it's supplied. */
export function HubDialog({ hub }: { hub?: Hub }) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const isEdit = Boolean(hub);

  const mutation = useMutation({
    mutationFn: async (value: z.infer<typeof schema>) => {
      if (hub) {
        await updateHub(hub.id, value);
        return;
      }
      await createHub(value);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.hubs.all });
      toast.success(isEdit ? "Hub updated." : "Hub created.");
      setOpen(false);
      if (!isEdit) {
        form.reset();
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "Could not save the hub.");
    },
  });

  const form = useForm({
    defaultValues: {
      name: hub?.name ?? "",
      address: hub?.address ?? "",
      lat: hub?.lat ?? null,
      lng: hub?.lng ?? null,
      isActive: hub?.isActive ?? true,
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
            <Button data-testid="create-hub" />
          )
        }
      >
        {isEdit ? (
          "Edit"
        ) : (
          <>
            <Plus data-icon="inline-start" />
            New hub
          </>
        )}
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit hub" : "Create a hub"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update this dark store's details."
              : "Dark stores fulfil orders from their own inventory."}
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
                      data-testid="hub-name"
                      id={field.name}
                      onBlur={field.handleBlur}
                      onChange={(event) =>
                        field.handleChange(event.target.value)
                      }
                      placeholder="Banjara Hills Dark Store"
                      value={field.state.value}
                    />
                    {invalid ? (
                      <FieldError errors={field.state.meta.errors} />
                    ) : null}
                  </Field>
                );
              }}
            </form.Field>

            <form.Field name="address">
              {(field) => {
                const invalid = field.state.meta.errors.length > 0;
                return (
                  <Field data-invalid={invalid || undefined}>
                    <FieldLabel htmlFor={field.name}>Address</FieldLabel>
                    <Input
                      aria-invalid={invalid || undefined}
                      data-testid="hub-address"
                      id={field.name}
                      onBlur={field.handleBlur}
                      onChange={(event) =>
                        field.handleChange(event.target.value)
                      }
                      placeholder="Road No. 12, Banjara Hills, Hyderabad"
                      value={field.state.value}
                    />
                    {invalid ? (
                      <FieldError errors={field.state.meta.errors} />
                    ) : null}
                  </Field>
                );
              }}
            </form.Field>

            <div className="grid grid-cols-2 gap-4">
              <form.Field name="lat">
                {(field) => {
                  const invalid = field.state.meta.errors.length > 0;
                  return (
                    <Field data-invalid={invalid || undefined}>
                      <FieldLabel htmlFor={field.name}>Latitude</FieldLabel>
                      <Input
                        aria-invalid={invalid || undefined}
                        data-testid="hub-lat"
                        id={field.name}
                        onBlur={field.handleBlur}
                        onChange={(event) =>
                          field.handleChange(
                            event.target.value === ""
                              ? null
                              : Number(event.target.value),
                          )
                        }
                        placeholder="17.4401"
                        step="any"
                        type="number"
                        value={field.state.value ?? ""}
                      />
                      {invalid ? (
                        <FieldError errors={field.state.meta.errors} />
                      ) : null}
                    </Field>
                  );
                }}
              </form.Field>

              <form.Field name="lng">
                {(field) => {
                  const invalid = field.state.meta.errors.length > 0;
                  return (
                    <Field data-invalid={invalid || undefined}>
                      <FieldLabel htmlFor={field.name}>Longitude</FieldLabel>
                      <Input
                        aria-invalid={invalid || undefined}
                        data-testid="hub-lng"
                        id={field.name}
                        onBlur={field.handleBlur}
                        onChange={(event) =>
                          field.handleChange(
                            event.target.value === ""
                              ? null
                              : Number(event.target.value),
                          )
                        }
                        placeholder="78.3489"
                        step="any"
                        type="number"
                        value={field.state.value ?? ""}
                      />
                      {invalid ? (
                        <FieldError errors={field.state.meta.errors} />
                      ) : null}
                    </Field>
                  );
                }}
              </form.Field>
            </div>

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
              data-testid="submit-hub"
              disabled={mutation.isPending}
              type="submit"
            >
              {mutation.isPending
                ? "Saving…"
                : isEdit
                  ? "Save changes"
                  : "Create hub"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default HubDialog;
