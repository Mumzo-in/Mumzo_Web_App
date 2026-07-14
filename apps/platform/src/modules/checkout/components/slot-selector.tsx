import { Check, Clock, Zap } from "lucide-react";

import { deliverySlots } from "../data/checkout-data";
import { useCheckout } from "../store/checkout-provider";

export default function SlotSelector() {
  const { slotId, setSlotId } = useCheckout();

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {deliverySlots.map((slot) => {
        const selected = slot.id === slotId;
        return (
          <button
            key={slot.id}
            type="button"
            onClick={() => setSlotId(slot.id)}
            className={`flex flex-col gap-1 rounded-2xl border p-4 text-left transition-colors ${
              selected
                ? "border-primary ring-1 ring-primary/30"
                : "border-border/60 hover:border-primary/40"
            }`}
          >
            <span className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 font-semibold text-ink text-sm">
                {slot.express ? (
                  <Zap size={14} className="text-primary" />
                ) : (
                  <Clock size={14} className="text-primary" />
                )}
                {slot.label}
              </span>
              {selected && <Check size={15} className="text-primary" />}
            </span>
            <span className="text-foreground/60 text-xs">{slot.detail}</span>
          </button>
        );
      })}
    </div>
  );
}
