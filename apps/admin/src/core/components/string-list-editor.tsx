import { Button } from "@mumzo/ui/components/button";
import { Input } from "@mumzo/ui/components/input";
import { Plus, X } from "lucide-react";

/** Repeatable single-line strings — highlights, tags. */
export function StringListEditor({
  value,
  onChange,
  placeholder,
  addLabel,
  testId,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  addLabel: string;
  testId?: string;
}) {
  function update(index: number, next: string) {
    onChange(value.map((item, i) => (i === index ? next : item)));
  }

  return (
    <div className="flex flex-col gap-2" data-testid={testId}>
      {value.map((item, index) => (
        // Appended/removed only, never reordered — index key is stable.
        <div key={`item-${index.toString()}`} className="flex gap-2">
          <Input
            value={item}
            placeholder={placeholder}
            onChange={(event) => update(index, event.target.value)}
            data-testid={testId ? `${testId}-${index}` : undefined}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Remove"
            onClick={() => onChange(value.filter((_, i) => i !== index))}
          >
            <X className="size-4" />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-fit"
        onClick={() => onChange([...value, ""])}
        data-testid={testId ? `${testId}-add` : undefined}
      >
        <Plus data-icon="inline-start" />
        {addLabel}
      </Button>
    </div>
  );
}

export default StringListEditor;
