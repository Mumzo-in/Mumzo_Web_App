import { Link } from "@tanstack/react-router";

const STEPS = [
  { key: "bag", label: "BAG", to: "/cart" },
  { key: "address", label: "ADDRESS", to: "/checkout/address" },
  { key: "payment", label: "PAYMENT", to: "/checkout/payment" },
] as const;

export type CheckoutStepKey = (typeof STEPS)[number]["key"];

export default function CheckoutSteps({
  current,
}: {
  current: CheckoutStepKey;
}) {
  const currentIdx = STEPS.findIndex((s) => s.key === current);

  return (
    <ol className="mx-auto flex w-full max-w-xl items-center justify-center px-2 py-3 font-semibold text-[11px] tracking-wider sm:py-4 sm:text-xs sm:tracking-widest md:text-sm">
      {STEPS.map((step, i) => {
        const done = i < currentIdx;
        const active = i === currentIdx;
        const reachable = i <= currentIdx;

        const labelClassName = `whitespace-nowrap transition-colors ${
          active
            ? "border-primary border-b-2 pb-0.5 font-bold text-primary"
            : done
              ? "text-primary hover:text-primary/80"
              : "text-muted-foreground/50"
        }`;

        return (
          <li key={step.key} className="flex items-center last:flex-none">
            {reachable && !active ? (
              <Link className={labelClassName} to={step.to}>
                {step.label}
              </Link>
            ) : (
              <span className={labelClassName}>{step.label}</span>
            )}
            {i < STEPS.length - 1 && (
              <span className="mx-2 h-0 w-8 flex-1 border-border/80 border-t border-dashed sm:mx-4 sm:w-16" />
            )}
          </li>
        );
      })}
    </ol>
  );
}
