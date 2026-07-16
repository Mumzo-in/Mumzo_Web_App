import { Button } from "@mumzo/ui/components/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@mumzo/ui/components/field";
import { Input } from "@mumzo/ui/components/input";
import { useForm } from "@tanstack/react-form";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import z from "zod";
import { authClient } from "../api/auth-client";

const schema = z.object({
  email: z.email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
});

/**
 * Staff sign-in. There is deliberately no sign-up path — admin accounts are
 * provisioned via `POST /api/v1/admin/staff` (api-plan §15k), never self-serve.
 */
export function SignInForm() {
  const navigate = useNavigate();
  const [pending, setPending] = useState(false);

  const form = useForm({
    defaultValues: { email: "", password: "" },
    validators: { onSubmit: schema },
    onSubmit: async ({ value }) => {
      setPending(true);
      await authClient.signIn.email(
        { email: value.email, password: value.password },
        {
          onSuccess: () => {
            navigate({ to: "/" });
          },
          onError: (ctx) => {
            toast.error(ctx.error.message || "Could not sign you in.");
          },
        },
      );
      setPending(false);
    },
  });

  return (
    <form
      data-testid="admin-sign-in-form"
      onSubmit={(event) => {
        event.preventDefault();
        event.stopPropagation();
        form.handleSubmit();
      }}
    >
      <FieldGroup>
        <form.Field name="email">
          {(field) => {
            const invalid = field.state.meta.errors.length > 0;
            return (
              <Field data-invalid={invalid || undefined}>
                <FieldLabel htmlFor={field.name}>Email</FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  type="email"
                  autoComplete="username"
                  aria-invalid={invalid || undefined}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                  data-testid="admin-sign-in-email"
                />
                {invalid ? (
                  <FieldError errors={field.state.meta.errors} />
                ) : null}
              </Field>
            );
          }}
        </form.Field>

        <form.Field name="password">
          {(field) => {
            const invalid = field.state.meta.errors.length > 0;
            return (
              <Field data-invalid={invalid || undefined}>
                <FieldLabel htmlFor={field.name}>Password</FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  type="password"
                  autoComplete="current-password"
                  aria-invalid={invalid || undefined}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                  data-testid="admin-sign-in-password"
                />
                {invalid ? (
                  <FieldError errors={field.state.meta.errors} />
                ) : null}
              </Field>
            );
          }}
        </form.Field>

        <Field>
          <Button
            type="submit"
            className="w-full"
            disabled={pending}
            data-testid="admin-sign-in-submit"
          >
            {pending ? "Signing in…" : "Sign in"}
          </Button>
        </Field>
      </FieldGroup>
    </form>
  );
}

export default SignInForm;
