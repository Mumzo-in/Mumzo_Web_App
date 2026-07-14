import { Check } from "lucide-react";

const STEPS = [
  { key: "address", label: "Address" },
  { key: "payment", label: "Payment" },
  { key: "review", label: "Review" },
] as const;

export type CheckoutStepKey = (typeof STEPS)[number]["key"];

export default function CheckoutSteps({
  current,
}: {
  current: CheckoutStepKey;
}) {
  const currentIdx = STEPS.findIndex((s) => s.key === current);

  return (
    <ol className="mx-auto flex max-w-xl items-center justify-center gap-2">
      {STEPS.map((step, i) => {
        const done = i < currentIdx;
        const active = i === currentIdx;
        return (
          <li key={step.key} className="flex flex-1 items-center gap-2">
            <div className="flex items-center gap-2">
              <span
                className={`flex size-8 shrink-0 items-center justify-center rounded-full border font-semibold text-sm transition-colors ${
                  done
                    ? "border-primary bg-primary text-primary-foreground"
                    : active
                      ? "border-primary text-primary"
                      : "border-border text-foreground/40"
                }`}
              >
                {done ? <Check size={15} /> : i + 1}
              </span>
              <span
                className={`hidden font-semibold text-sm sm:block ${
                  active || done ? "text-ink" : "text-foreground/40"
                }`}
              >
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <span
                className={`h-px flex-1 ${done ? "bg-primary" : "bg-border"}`}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
