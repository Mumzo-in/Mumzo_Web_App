import { cn } from "@mumzo/ui/lib/utils";
import { Check, Sparkles } from "lucide-react";

import type { Offer } from "@/core/data";

interface CouponCardProps {
  offer: Offer;
  selected: boolean;
  onSelect: () => void;
}

export default function CouponCard({
  offer,
  selected,
  onSelect,
}: CouponCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      data-testid={`web-offer-${offer.code}`}
      aria-pressed={selected}
      className={cn(
        "flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-colors",
        selected
          ? "border-pinkDeep bg-blush"
          : "border-transparent bg-blush/30 hover:bg-blush/60",
      )}
    >
      <Sparkles size={16} className="mt-0.5 shrink-0 text-pinkDeep" />
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-foreground text-sm">{offer.code}</p>
        <p className="text-foreground/60 text-xs">{offer.desc}</p>
      </div>
      {selected && (
        <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-pinkDeep text-white">
          <Check size={12} strokeWidth={3} />
        </span>
      )}
    </button>
  );
}
