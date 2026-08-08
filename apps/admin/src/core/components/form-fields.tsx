import {
  Field,
  FieldDescription,
  FieldError,
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
import { Textarea } from "@mumzo/ui/components/textarea";
import type { AnyFieldApi } from "@tanstack/react-form";
import type { ReactNode } from "react";

/**
 * Thin wrappers over a TanStack Form field, so the product form doesn't repeat
 * the Field/Label/Input/error block ~20 times. Each takes a bound `field` and
 * renders the shared invalid/`data-invalid` treatment.
 */

/** Normalizes TanStack's mixed error entries to `FieldError`'s `{message}` shape. */
function errorsOf(field: AnyFieldApi): { message: string }[] {
  return field.state.meta.errors
    .map((error) => {
      const message =
        typeof error === "string" ? error : (error?.message ?? "");
      return { message };
    })
    .filter((entry) => entry.message.length > 0);
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

/** Hex color input paired with a native swatch button that opens the OS color picker. */
export function ColorField({
  field,
  label,
  description,
  placeholder,
  testId,
}: BaseProps & { placeholder?: string; testId?: string }) {
  const errors = errorsOf(field);
  const invalid = errors.length > 0;
  const value: string = field.state.value ?? "";
  const isValidHex = /^#[0-9a-fA-F]{6}$/.test(value);

  return (
    <Field data-invalid={invalid || undefined}>
      <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
      <div className="flex items-center gap-2">
        <div className="relative size-9 shrink-0 overflow-hidden rounded-lg border border-border">
          <input
            aria-label={`${label} swatch`}
            className="absolute inset-0 size-full cursor-pointer border-none p-0"
            onChange={(event) => field.handleChange(event.target.value)}
            type="color"
            value={isValidHex ? value : "#f6f3ec"}
          />
        </div>
        <Input
          aria-invalid={invalid || undefined}
          className="flex-1"
          data-testid={testId}
          id={field.name}
          name={field.name}
          onBlur={field.handleBlur}
          onChange={(event) => field.handleChange(event.target.value)}
          placeholder={placeholder}
          value={value}
        />
      </div>
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

export function SelectField({
  field,
  label,
  description,
  placeholder = "Select…",
  options,
  testId,
}: BaseProps & {
  placeholder?: string;
  options: { value: string; label: string }[];
  testId?: string;
}) {
  const errors = errorsOf(field);
  const invalid = errors.length > 0;
  return (
    <Field data-invalid={invalid || undefined}>
      <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
      <Select
        onValueChange={(value) => field.handleChange(value)}
        value={field.state.value ?? ""}
      >
        <SelectTrigger
          aria-invalid={invalid || undefined}
          className="w-full"
          data-testid={testId}
          id={field.name}
        >
          <SelectValue placeholder={placeholder}>
            {(value: string) =>
              value
                ? (options.find((option) => option.value === value)?.label ??
                  value)
                : placeholder
            }
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
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
