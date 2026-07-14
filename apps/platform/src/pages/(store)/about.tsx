import { createFileRoute, Link } from "@tanstack/react-router";
import { Clock, HeartHandshake, Leaf, ShieldCheck } from "lucide-react";

import Breadcrumbs from "@/core/components/breadcrumbs";

export const Route = createFileRoute("/(store)/about")({
  component: AboutPage,
});

const VALUES = [
  {
    icon: Clock,
    title: "In minutes",
    body: "10-minute delivery from dark stores across Hyderabad, so you never run out at 2 AM.",
  },
  {
    icon: ShieldCheck,
    title: "Safety first",
    body: "Every product is vetted for babies — genuine brands, batch-tracked, expiry-checked.",
  },
  {
    icon: Leaf,
    title: "Gentle & clean",
    body: "We favour gentle, tested, mom-approved products for delicate skin and tummies.",
  },
  {
    icon: HeartHandshake,
    title: "Made for moms",
    body: "Built around real parenting moments — reorders, subscriptions, and age-based picks.",
  },
];

function AboutPage() {
  return (
    <div className="mx-auto max-w-[960px] px-4 pt-8 pb-20">
      <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "About" }]} />

      <section className="overflow-hidden rounded-3xl border border-border/60 bg-blush/40 p-8 sm:p-12">
        <p className="kicker text-primary">Our story</p>
        <h1 className="mt-4 max-w-2xl font-editorial text-4xl text-ink leading-tight tracking-tight sm:text-5xl">
          The deepest shelf for the tiniest humans.
        </h1>
        <p className="mt-4 max-w-2xl text-foreground/70 leading-relaxed">
          Mumzo began with a simple 2 AM problem — running out of diapers with a
          crying baby and no shop open. We built a quick-commerce store made
          only for moms and babies, stocked with the things you actually need,
          delivered in minutes with a lot of love.
        </p>
      </section>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {VALUES.map((v) => {
          const Icon = v.icon;
          return (
            <div
              key={v.title}
              className="flex flex-col gap-3 rounded-3xl border border-border/60 bg-white p-6"
            >
              <span className="flex size-11 items-center justify-center rounded-2xl bg-accent/40 text-primary">
                <Icon size={20} />
              </span>
              <h2 className="font-editorial text-ink text-xl">{v.title}</h2>
              <p className="text-foreground/70 text-sm leading-relaxed">
                {v.body}
              </p>
            </div>
          );
        })}
      </div>

      <section className="mt-8 flex flex-col items-center gap-4 rounded-3xl border border-border/60 bg-sage/40 p-8 text-center">
        <h2 className="font-editorial text-2xl text-ink">
          Now delivering across Hyderabad
        </h2>
        <p className="max-w-md text-foreground/70 text-sm leading-relaxed">
          Join thousands of parents who trust Mumzo for everyday baby care.
        </p>
        <Link
          to="/"
          className="rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground text-sm transition-colors hover:bg-primary/95"
        >
          Start shopping
        </Link>
      </section>
    </div>
  );
}
