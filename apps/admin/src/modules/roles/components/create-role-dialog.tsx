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
import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { createRole } from "../api/roles-api";
import { rolesQueryKeys } from "../queries/roles";

/**
 * `key` must match the server's rule: it is stored in `staff_user.role` as a
 * plain string, and Better Auth splits that on commas for multi-role users.
 */
const schema = z.object({
  key: z
    .string()
    .min(2, "At least 2 characters.")
    .max(40)
    .regex(
      /^[a-z][a-z0-9_]*$/,
      "Lowercase letters, digits and underscores only.",
    ),
  label: z.string().min(2, "Give the role a readable name."),
  // Not `.optional()`: defaultValues seeds it with "", and an optional
  // field would make the inferred input type disagree with the form state.
  description: z.string().max(200),
});

export function CreateRoleDialog() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: createRole,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: rolesQueryKeys.all });
      toast.success("Role created. Set its permissions below.");
      setOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Could not create the role.");
    },
  });

  const form = useForm({
    defaultValues: { key: "", label: "", description: "" },
    validators: { onSubmit: schema },
    onSubmit: async ({ value }) => {
      await mutation.mutateAsync({
        key: value.key,
        label: value.label,
        description: value.description || undefined,
        // Starts with no grants — least privilege by default.
        permissions: {},
      });
    },
  });

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger render={<Button data-testid="create-role" />}>
        <Plus data-icon="inline-start" />
        New role
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a role</DialogTitle>
          <DialogDescription>
            The role starts with no permissions. Grant them from the matrix once
            it exists.
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
            <form.Field name="label">
              {(field) => {
                const invalid = field.state.meta.errors.length > 0;
                return (
                  <Field data-invalid={invalid || undefined}>
                    <FieldLabel htmlFor={field.name}>Name</FieldLabel>
                    <Input
                      aria-invalid={invalid || undefined}
                      data-testid="role-label"
                      id={field.name}
                      onBlur={field.handleBlur}
                      onChange={(event) => {
                        field.handleChange(event.target.value);
                        // Suggest a key from the name, but leave it editable.
                        if (!form.getFieldValue("key")) {
                          form.setFieldValue(
                            "key",
                            event.target.value
                              .toLowerCase()
                              .replace(/[^a-z0-9]+/g, "_")
                              .replace(/^_+|_+$/g, ""),
                          );
                        }
                      }}
                      placeholder="Warehouse Lead"
                      value={field.state.value}
                    />
                    {invalid ? (
                      <FieldError errors={field.state.meta.errors} />
                    ) : null}
                  </Field>
                );
              }}
            </form.Field>

            <form.Field name="key">
              {(field) => {
                const invalid = field.state.meta.errors.length > 0;
                return (
                  <Field data-invalid={invalid || undefined}>
                    <FieldLabel htmlFor={field.name}>Key</FieldLabel>
                    <Input
                      aria-invalid={invalid || undefined}
                      data-testid="role-key"
                      id={field.name}
                      onBlur={field.handleBlur}
                      onChange={(event) =>
                        field.handleChange(event.target.value)
                      }
                      placeholder="warehouse_lead"
                      value={field.state.value}
                    />
                    <FieldDescription>
                      Stored on the staff record. Cannot be changed later.
                    </FieldDescription>
                    {invalid ? (
                      <FieldError errors={field.state.meta.errors} />
                    ) : null}
                  </Field>
                );
              }}
            </form.Field>

            <form.Field name="description">
              {(field) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>Description</FieldLabel>
                  <Input
                    data-testid="role-description"
                    id={field.name}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                    placeholder="What this role is for"
                    value={field.state.value}
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
              data-testid="submit-role"
              disabled={mutation.isPending}
              type="submit"
            >
              {mutation.isPending ? "Creating…" : "Create role"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
