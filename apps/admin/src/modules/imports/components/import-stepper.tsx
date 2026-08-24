import { cn } from "@mumzo/ui/lib/utils";

export type ImportStep = "upload" | "map" | "resolve" | "import" | "done";

const STEPS: { key: ImportStep; label: string }[] = [
  { key: "upload", label: "Upload" },
  { key: "map", label: "Map columns" },
  { key: "resolve", label: "Resolve" },
  { key: "import", label: "Import" },
  { key: "done", label: "Done" },
];

/** Horizontal dot-and-line progress tracker for the 5-step import wizard —
 * no existing stepper primitive in the design system, built for this
 * feature specifically. */
export default function ImportStepper({
  current,
  caption,
}: {
  current: ImportStep;
  /** Small status line under the dots, e.g. "3 unresolved · 2 row errors". */
  caption?: string;
}) {
  const currentIndex = STEPS.findIndex((s) => s.key === current);

  return (
    <div className="flex flex-col gap-1.5" data-testid="import-stepper">
      <div className="flex items-center gap-2">
        {STEPS.map((step, index) => (
          <div className="flex items-center gap-2" key={step.key}>
            <span
              className={cn(
                "flex size-2.5 shrink-0 rounded-full transition-colors",
                index <= currentIndex ? "bg-primary" : "bg-muted",
              )}
            />
            {index < STEPS.length - 1 && (
              <span
                className={cn(
                  "h-px w-8",
                  index < currentIndex ? "bg-primary" : "bg-muted",
                )}
              />
            )}
          </div>
        ))}
      </div>
      <p className="text-muted-foreground text-xs">
        Step {currentIndex + 1} of {STEPS.length} — {STEPS[currentIndex]?.label}
        {caption ? ` · ${caption}` : ""}
      </p>
    </div>
  );
}
