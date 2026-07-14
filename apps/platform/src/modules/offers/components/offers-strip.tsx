import { Link } from "@tanstack/react-router";
import { ArrowRight, TicketPercent } from "lucide-react";

import { offers } from "@/core/data";

/** Compact home-page offers strip linking into the full offers page. */
export default function OffersStrip() {
  return (
    <div className="no-scrollbar flex gap-4 overflow-x-auto pb-1">
      {offers.map((offer) => (
        <Link
          key={offer.code}
          to="/offers"
          className="group flex min-w-[260px] flex-1 items-center gap-3 rounded-3xl border border-border/60 bg-blush/40 p-4 transition-colors hover:border-primary/40"
        >
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-white text-primary">
            <TicketPercent size={20} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-ink text-sm">{offer.code}</p>
            <p className="truncate text-foreground/60 text-xs">{offer.desc}</p>
          </div>
          <ArrowRight
            size={16}
            className="shrink-0 text-primary transition-transform group-hover:translate-x-0.5"
          />
        </Link>
      ))}
    </div>
  );
}
