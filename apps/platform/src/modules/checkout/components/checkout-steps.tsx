const STEPS = [
  { key: "bag", label: "BAG" },
  { key: "address", label: "ADDRESS" },
  { key: "payment", label: "PAYMENT" },
] as const;

export type CheckoutStepKey = (typeof STEPS)[number]["key"];

export default function CheckoutSteps({
  current,
}: {
  current: CheckoutStepKey;
}) {
  const currentIdx = STEPS.findIndex((s) => s.key === current);

  return (
    <ol className="mx-auto flex w-full max-w-2xl items-center justify-center py-4 font-semibold text-xs tracking-widest sm:text-sm">
      {STEPS.map((step, i) => {
        const done = i < currentIdx;
        const active = i === currentIdx;

        return (
          <li
            key={step.key}
            className="flex flex-1 items-center last:flex-none"
          >
            <span
              className={`whitespace-nowrap transition-colors ${
                active
                  ? "border-primary border-b-2 pb-0.5 font-bold text-primary"
                  : done
                    ? "text-primary"
                    : "text-muted-foreground/50"
              }`}
            >
              {step.label}
            </span>
            {i < STEPS.length - 1 && (
              <span className="mx-4 h-0 flex-1 border-border/80 border-t border-dashed" />
            )}
          </li>
        );
      })}
    </ol>
  );
}
