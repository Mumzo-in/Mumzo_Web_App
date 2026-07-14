import { createFileRoute } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";

import Breadcrumbs from "@/core/components/breadcrumbs";
import { offers } from "@/core/data";
import { OfferCard } from "@/modules/offers";

export const Route = createFileRoute("/(store)/offers")({
  component: OffersPage,
});

function OffersPage() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 pt-8 pb-16">
      <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Offers" }]} />

      <div className="mb-8 overflow-hidden rounded-3xl border border-border/60 bg-blush/40 p-8">
        <p className="kicker text-primary">Save more</p>
        <h1 className="mt-3 font-editorial text-4xl text-ink leading-tight tracking-tight sm:text-5xl">
          Offers & coupons
        </h1>
        <p className="mt-3 max-w-xl text-foreground/70 leading-relaxed">
          Apply any of these at checkout to save on your baby essentials.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {offers.map((offer) => (
          <OfferCard key={offer.code} offer={offer} />
        ))}
      </div>

      <div className="mt-8 flex items-start gap-3 rounded-3xl border border-border/60 bg-secondary/50 p-5 text-foreground/60 text-sm leading-relaxed">
        <Sparkles size={17} className="mt-0.5 shrink-0 text-primary" />
        <p>
          Coupons apply to eligible items and can't be clubbed. Discounts are
          subject to minimum order value and may change. See each coupon's terms
          at checkout.
        </p>
      </div>
    </div>
  );
}
