import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@mumzo/ui/components/field";
import { Input } from "@mumzo/ui/components/input";
import { Textarea } from "@mumzo/ui/components/textarea";
import type { AnyFieldApi } from "@tanstack/react-form";
import type { ReactNode } from "react";

/**
 * Thin wrappers over a TanStack Form field, so the product form doesn't repeat
 * the Field/Label/Input/error block ~20 times. Each takes a bound `field` and
 * renders the shared invalid/`data-invalid` treatment.
 */

function errorsOf(field: AnyFieldApi): string[] {
  return field.state.meta.errors
    .map((error) =>
      typeof error === "string" ? error : (error?.message ?? ""),
    )
    .filter(Boolean);
}

type BaseProps = {
  field: AnyFieldApi;
  label: string;
  description?: string;
};

export function TextField({
  field,
  label,
  description,
  type = "text",
  placeholder,
  testId,
}: BaseProps & {
  type?: string;
  placeholder?: string;
  testId?: string;
}) {
  const errors = errorsOf(field);
  const invalid = errors.length > 0;
  return (
    <Field data-invalid={invalid || undefined}>
      <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
      <Input
        id={field.name}
        name={field.name}
        type={type}
        placeholder={placeholder}
        aria-invalid={invalid || undefined}
        value={field.state.value ?? ""}
        onBlur={field.handleBlur}
        onChange={(event) => field.handleChange(event.target.value)}
        data-testid={testId}
      />
      {description ? <FieldDescription>{description}</FieldDescription> : null}
      {invalid ? <FieldError errors={errors} /> : null}
    </Field>
  );
}

export function NumberField({
  field,
  label,
  description,
  placeholder,
  testId,
}: BaseProps & { placeholder?: string; testId?: string }) {
  const errors = errorsOf(field);
  const invalid = errors.length > 0;
  return (
    <Field data-invalid={invalid || undefined}>
      <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
      <Input
        id={field.name}
        name={field.name}
        type="number"
        inputMode="numeric"
        placeholder={placeholder}
        aria-invalid={invalid || undefined}
        value={field.state.value ?? ""}
        onBlur={field.handleBlur}
        onChange={(event) => {
          const next = event.target.value;
          // Empty clears to null; otherwise store a number so Zod sees numbers.
          field.handleChange(next === "" ? null : Number(next));
        }}
        data-testid={testId}
      />
      {description ? <FieldDescription>{description}</FieldDescription> : null}
      {invalid ? <FieldError errors={errors} /> : null}
    </Field>
  );
}

export function TextareaField({
  field,
  label,
  description,
  rows = 4,
  testId,
}: BaseProps & { rows?: number; testId?: string }) {
  const errors = errorsOf(field);
  const invalid = errors.length > 0;
  return (
    <Field data-invalid={invalid || undefined}>
      <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
      <Textarea
        id={field.name}
        name={field.name}
        rows={rows}
        aria-invalid={invalid || undefined}
        value={field.state.value ?? ""}
        onBlur={field.handleBlur}
        onChange={(event) => field.handleChange(event.target.value)}
        data-testid={testId}
      />
      {description ? <FieldDescription>{description}</FieldDescription> : null}
      {invalid ? <FieldError errors={errors} /> : null}
    </Field>
  );
}

/** Wraps a bespoke control (select, toggle group…) in the Field chrome. */
export function ControlField({
  field,
  label,
  description,
  children,
}: BaseProps & { children: ReactNode }) {
  const errors = errorsOf(field);
  const invalid = errors.length > 0;
  return (
    <Field data-invalid={invalid || undefined}>
      <FieldLabel>{label}</FieldLabel>
      {children}
      {description ? <FieldDescription>{description}</FieldDescription> : null}
      {invalid ? <FieldError errors={errors} /> : null}
    </Field>
  );
}
