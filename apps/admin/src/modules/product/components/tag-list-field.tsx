import { Badge } from "@mumzo/ui/components/badge";
import { Field, FieldLabel } from "@mumzo/ui/components/field";
import { X } from "lucide-react";
import { type KeyboardEvent, useState } from "react";

/** Free-form chip list: type + Enter to add, click × to remove. */
export function TagListField({
  label,
  description,
  placeholder,
  values,
  onChange,
  testId,
}: {
  label: string;
  description?: string;
  placeholder?: string;
  values: string[];
  onChange: (next: string[]) => void;
  testId?: string;
}) {
  const [draft, setDraft] = useState("");

  function commit() {
    const value = draft.trim();
    if (value && !values.includes(value)) {
      onChange([...values, value]);
    }
    setDraft("");
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      commit();
    } else if (event.key === "Backspace" && draft === "" && values.length > 0) {
      onChange(values.slice(0, -1));
    }
  }

  return (
    <Field>
      <FieldLabel>{label}</FieldLabel>
      <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-border bg-background p-2">
        {values.map((value) => (
          <Badge key={value} variant="secondary">
            {value}
            <button
              aria-label={`Remove ${value}`}
              className="ml-0.5"
              onClick={() => onChange(values.filter((v) => v !== value))}
              type="button"
            >
              <X data-icon="inline-end" />
            </button>
          </Badge>
        ))}
        <input
          className="min-w-24 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          data-testid={testId}
          onBlur={commit}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={values.length === 0 ? placeholder : ""}
          value={draft}
        />
      </div>
      {description ? (
        <p className="text-muted-foreground text-xs">{description}</p>
      ) : null}
    </Field>
  );
}
