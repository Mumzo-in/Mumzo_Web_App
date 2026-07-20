import { Button } from "@mumzo/ui/components/button";
import { Checkbox } from "@mumzo/ui/components/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@mumzo/ui/components/dialog";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@mumzo/ui/components/field";
import { Input } from "@mumzo/ui/components/input";
import {
  NativeSelect,
  NativeSelectOption,
} from "@mumzo/ui/components/native-select";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Copy, Eye, EyeOff, UserPlus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import z from "zod";
import { authClient } from "@/modules/auth";
import { rolesQueryOptions } from "@/modules/roles";
import { staffListQueryOptions } from "../queries/staff";

const staffSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters."),
    email: z.string().email("Enter a valid email address."),
    // Validated against the live role list, not a fixed union — roles are
    // created from the panel and a hardcoded enum would reject new ones.
    role: z.string().min(1, "Pick a role."),
    autoGeneratePassword: z.boolean(),
    password: z.string(),
  })
  .superRefine((data, ctx) => {
    if (!data.autoGeneratePassword) {
      if (!data.password || data.password.length < 12) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Password must be at least 12 characters.",
          path: ["password"],
        });
      }
    }
  });

function generateRandomPassword() {
  const chars =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
  let password = "";
  for (let i = 0; i < 16; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

export function CreateStaffDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  // Live role list — includes any role created from the roles page.
  const roles = useQuery(rolesQueryOptions);
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);
  const [createdUser, setCreatedUser] = useState<{
    name: string;
    email: string;
    password: string;
  } | null>(null);

  const mutation = useMutation({
    mutationFn: async (values: z.infer<typeof staffSchema>) => {
      const password = values.autoGeneratePassword
        ? generateRandomPassword()
        : values.password || "";

      const res = await authClient.admin.createUser({
        email: values.email,
        password: password,
        name: values.name,
        role: values.role as "admin",
      });

      if (res.error) {
        throw new Error(res.error.message || "Failed to create staff member");
      }

      return {
        name: values.name,
        email: values.email,
        password: password,
      };
    },
    onSuccess: (data) => {
      toast.success("Staff member created successfully!");
      queryClient.invalidateQueries(staffListQueryOptions);
      setCreatedUser(data);
    },
    onError: (error: Error) => {
      toast.error(error.message || "An error occurred.");
    },
  });

  const form = useForm({
    defaultValues: {
      name: "",
      email: "",
      role: "support",
      autoGeneratePassword: true,
      password: "",
    },
    validators: {
      onSubmit: staffSchema,
    },
    onSubmit: async ({ value }) => {
      await mutation.mutateAsync(value);
    },
  });

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Password copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy password.");
    }
  };

  const handleClose = () => {
    setCreatedUser(null);
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        if (!val) {
          handleClose();
        } else {
          onOpenChange(true);
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        {createdUser ? (
          <div className="flex flex-col gap-4 py-4">
            <DialogHeader>
              <DialogTitle className="text-xl tracking-tight">
                Staff Account Created
              </DialogTitle>
              <DialogDescription>
                The staff member has been successfully created. Copy and share
                the temporary password below.
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-2 rounded-xl bg-muted p-4">
              <span className="font-semibold text-[10px] text-muted-foreground uppercase tracking-wider">
                Temporary Password
              </span>
              <div className="mt-1 flex items-center justify-between gap-2">
                <span className="select-all break-all font-mono text-sm">
                  {createdUser.password}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="size-8 shrink-0"
                  onClick={() => handleCopy(createdUser.password)}
                >
                  {copied ? (
                    <Check className="size-4 text-emerald-500" />
                  ) : (
                    <Copy className="size-4" />
                  )}
                </Button>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" onClick={handleClose} className="w-full">
                Done
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              form.handleSubmit();
            }}
            className="flex flex-col gap-4"
          >
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl tracking-tight">
                <UserPlus className="size-5 text-primary" />
                Add Staff Member
              </DialogTitle>
              <DialogDescription>
                Invite a new team member to the Mumzo control panel.
              </DialogDescription>
            </DialogHeader>

            <FieldGroup>
              <form.Field name="name">
                {(field) => {
                  const invalid = field.state.meta.errors.length > 0;
                  return (
                    <Field data-invalid={invalid || undefined}>
                      <FieldLabel htmlFor={field.name}>Full Name</FieldLabel>
                      <Input
                        id={field.name}
                        name={field.name}
                        placeholder="John Doe"
                        aria-invalid={invalid || undefined}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                      />
                      {invalid && (
                        <FieldError errors={field.state.meta.errors} />
                      )}
                    </Field>
                  );
                }}
              </form.Field>

              <form.Field name="email">
                {(field) => {
                  const invalid = field.state.meta.errors.length > 0;
                  return (
                    <Field data-invalid={invalid || undefined}>
                      <FieldLabel htmlFor={field.name}>
                        Email Address
                      </FieldLabel>
                      <Input
                        id={field.name}
                        name={field.name}
                        type="email"
                        placeholder="name@mumzo.in"
                        aria-invalid={invalid || undefined}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                      />
                      {invalid && (
                        <FieldError errors={field.state.meta.errors} />
                      )}
                    </Field>
                  );
                }}
              </form.Field>

              <form.Field name="role">
                {(field) => {
                  const invalid = field.state.meta.errors.length > 0;
                  return (
                    <Field data-invalid={invalid || undefined}>
                      <FieldLabel htmlFor={field.name}>Role</FieldLabel>
                      <NativeSelect
                        id={field.name}
                        name={field.name}
                        className="w-full"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                      >
                        {(roles.data ?? []).map((role) => (
                          <NativeSelectOption key={role.key} value={role.key}>
                            {role.label}
                          </NativeSelectOption>
                        ))}
                      </NativeSelect>
                      {invalid && (
                        <FieldError errors={field.state.meta.errors} />
                      )}
                    </Field>
                  );
                }}
              </form.Field>

              <form.Field name="autoGeneratePassword">
                {(field) => {
                  return (
                    <Field
                      orientation="horizontal"
                      className="items-center gap-3"
                    >
                      <Checkbox
                        id={field.name}
                        name={field.name}
                        checked={field.state.value}
                        onCheckedChange={(checked) => {
                          field.handleChange(!!checked);
                        }}
                      />
                      <FieldLabel
                        htmlFor={field.name}
                        className="cursor-pointer font-normal text-xs"
                      >
                        Auto-generate secure password
                      </FieldLabel>
                    </Field>
                  );
                }}
              </form.Field>

              <form.Subscribe
                selector={(state) => state.values.autoGeneratePassword}
              >
                {(autoGenerate) => {
                  if (autoGenerate) return null;
                  return (
                    <form.Field name="password">
                      {(field) => {
                        const invalid = field.state.meta.errors.length > 0;
                        return (
                          <Field data-invalid={invalid || undefined}>
                            <FieldLabel htmlFor={field.name}>
                              Password
                            </FieldLabel>
                            <div className="relative flex items-center">
                              <Input
                                id={field.name}
                                name={field.name}
                                type={showPassword ? "text" : "password"}
                                placeholder="Minimum 12 characters"
                                aria-invalid={invalid || undefined}
                                className="w-full pr-10"
                                value={field.state.value}
                                onBlur={field.handleBlur}
                                onChange={(e) =>
                                  field.handleChange(e.target.value)
                                }
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute right-1 size-8 hover:bg-transparent"
                                onClick={() => setShowPassword(!showPassword)}
                              >
                                {showPassword ? (
                                  <EyeOff className="size-4" />
                                ) : (
                                  <Eye className="size-4" />
                                )}
                              </Button>
                            </div>
                            {invalid && (
                              <FieldError errors={field.state.meta.errors} />
                            )}
                          </Field>
                        );
                      }}
                    </form.Field>
                  );
                }}
              </form.Subscribe>
            </FieldGroup>

            <DialogFooter className="mt-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={mutation.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Adding…" : "Add Staff"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
