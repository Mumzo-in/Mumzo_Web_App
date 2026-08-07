import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Sparkles, TicketPercent } from "lucide-react";

import Breadcrumbs from "@/core/components/breadcrumbs";
import { listPublicCoupons } from "@/modules/cart";
import { OfferCard } from "@/modules/offers";

export const Route = createFileRoute("/(store)/offers")({
  component: OffersPage,
});

function OffersPage() {
  const { data: coupons, isLoading } = useQuery({
    queryKey: ["coupons", "public-list"],
    queryFn: listPublicCoupons,
  });

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

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex h-40 animate-pulse flex-col gap-4 rounded-3xl border border-border/60 bg-white p-5"
            >
              <div className="flex items-start gap-3">
                <div className="size-11 rounded-2xl bg-secondary" />
                <div className="flex-1 space-y-2">
                  <div className="h-5 w-24 rounded bg-secondary" />
                  <div className="h-4 w-40 rounded bg-secondary" />
                </div>
              </div>
              <div className="mt-auto flex items-center justify-between border-border/60 border-t pt-4">
                <div className="h-4 w-20 rounded bg-secondary" />
                <div className="h-6 w-16 rounded bg-secondary" />
              </div>
            </div>
          ))}
        </div>
      ) : !coupons || coupons.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-border/80 border-dashed bg-white p-12 text-center text-muted-foreground">
          <TicketPercent size={40} className="mb-3 text-muted-foreground/40" />
          <p className="font-semibold text-sm">No active offers right now</p>
          <p className="mt-1 max-w-sm text-xs leading-relaxed">
            Check back later! We regularly release discount coupons for baby
            essentials.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {coupons.map((c) => {
            const offer = {
              code: c.code,
              desc:
                c.description ||
                (c.type === "flat"
                  ? `Flat ₹${c.value} off`
                  : `${c.value}% off${c.cap ? ` up to ₹${c.cap}` : ""}`),
              minAmt: c.minAmt,
            };
            return <OfferCard key={offer.code} offer={offer} />;
          })}
        </div>
      )}

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
