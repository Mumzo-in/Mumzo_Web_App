import { Check, Copy, Tag } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import type { ReferralOffer } from "../data/referral-data";

/**
 * Referral-linked offers the customer can hand out alongside their code —
 * separate from the tier rewards they earn themselves.
 */
export default function ReferralOffers({
  offers,
}: {
  offers: ReferralOffer[];
}) {
  if (offers.length === 0) {
    return null;
  }

  return (
    <div className="rounded-3xl border border-border/60 bg-card p-6">
      <h2 className="font-editorial text-ink text-xl">Offers to share</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {offers.map((offer) => (
          <OfferRow key={offer.id} offer={offer} />
        ))}
      </div>
    </div>
  );
}

function OfferRow({ offer }: { offer: ReferralOffer }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(offer.code);
    } catch {
      // clipboard may be unavailable
    }
    setCopied(true);
    toast.success(`Copied ${offer.code}`);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div
      className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-secondary/30 p-4"
      data-testid={`referral-offer-${offer.id}`}
    >
      <span className="flex size-9 items-center justify-center rounded-2xl bg-accent/40 text-primary">
        <Tag size={16} />
      </span>
      <div>
        <p className="font-semibold text-ink text-sm">{offer.headline}</p>
        <p className="mt-0.5 text-foreground/60 text-xs leading-relaxed">
          {offer.detail}
        </p>
      </div>
      <button
        type="button"
        onClick={copy}
        className="mt-auto inline-flex w-fit items-center gap-2 rounded-full border border-primary/30 border-dashed bg-card px-4 py-2 font-semibold text-ink text-sm transition-colors hover:bg-secondary"
      >
        {copied ? <Check size={14} /> : <Copy size={14} />}
        {offer.code}
      </button>
    </div>
  );
}
