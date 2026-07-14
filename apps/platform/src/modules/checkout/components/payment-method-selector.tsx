import { Check, CreditCard } from "lucide-react";

import { paymentMethods } from "../data/checkout-data";
import { useCheckout } from "../store/checkout-provider";

export default function PaymentMethodSelector() {
  const { paymentMethod, setPaymentMethod } = useCheckout();

  return (
    <div className="flex flex-col gap-3">
      {paymentMethods.map((method) => {
        const selected = method.id === paymentMethod;
        return (
          <button
            key={method.id}
            type="button"
            onClick={() => setPaymentMethod(method.id)}
            data-testid={`web-pay-${method.id}`}
            className={`flex items-center gap-4 rounded-2xl border p-4 text-left transition-colors ${
              selected
                ? "border-primary ring-1 ring-primary/30"
                : "border-border/60 hover:border-primary/40"
            }`}
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent/40 text-primary">
              <CreditCard size={18} />
            </span>
            <span className="flex flex-1 flex-col">
              <span className="font-semibold text-ink text-sm">
                {method.label}
              </span>
              <span className="text-foreground/60 text-xs">
                {method.detail}
              </span>
            </span>
            <span
              className={`flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors ${
                selected
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border"
              }`}
            >
              {selected && <Check size={12} />}
            </span>
          </button>
        );
      })}
    </div>
  );
}
