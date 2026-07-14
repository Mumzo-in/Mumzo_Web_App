import { Check, Copy, TicketPercent } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Offer } from "@/core/data";

export default function OfferCard({ offer }: { offer: Offer }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(offer.code);
    } catch {
      // clipboard may be unavailable; still show copied affordance
    }
    setCopied(true);
    toast.success(`Copied ${offer.code}`);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div
      data-testid={`web-offer-card-${offer.code}`}
      className="flex flex-col gap-4 rounded-3xl border border-border/60 bg-white p-5"
    >
      <div className="flex items-start gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-accent/40 text-primary">
          <TicketPercent size={20} />
        </span>
        <div className="flex-1">
          <p className="font-editorial text-ink text-lg leading-tight">
            {offer.code}
          </p>
          <p className="mt-1 text-foreground/70 text-sm leading-relaxed">
            {offer.desc}
          </p>
        </div>
      </div>
      <div className="flex items-center justify-between border-border/60 border-t pt-4">
        <span className="text-foreground/50 text-xs">
          {offer.minAmt ? `On orders above ₹${offer.minAmt}` : "No minimum"}
        </span>
        <button
          type="button"
          onClick={copy}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-primary/30 px-4 py-1.5 font-semibold text-primary text-xs transition-colors hover:bg-primary/5"
        >
          {copied ? <Check size={13} /> : <Copy size={13} />}
          {copied ? "Copied" : "Copy code"}
        </button>
      </div>
    </div>
  );
}
