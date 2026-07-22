import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { BadgeCheck } from "lucide-react";

import Breadcrumbs from "@/core/components/breadcrumbs";
import { brandsQueryOptions } from "@/modules/catalog";

export const Route = createFileRoute("/(store)/brand/")({
  component: BrandsIndexPage,
});

function BrandsIndexPage() {
  const { data: brands = [] } = useQuery(brandsQueryOptions);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pt-8 pb-16">
      <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Brands" }]} />

      <div className="mb-8 rounded-3xl border border-border/60 bg-blush/40 p-8">
        <p className="kicker text-primary">Only the genuine</p>
        <h1 className="mt-3 font-editorial text-4xl text-ink leading-tight tracking-tight sm:text-5xl">
          Shop by brand
        </h1>
        <p className="mt-3 max-w-xl text-foreground/70 leading-relaxed">
          Every brand on Mumzo is sourced from authorised distributors,
          batch-tracked and expiry-checked before it reaches your door.
        </p>
      </div>

      <p className="mb-5 text-foreground/60 text-sm">{brands.length} brands</p>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {brands.map((brand) => (
          <Link
            key={brand.slug}
            to="/brand/$brand"
            params={{ brand: brand.slug }}
            data-testid={`web-brand-${brand.slug}`}
            className="group flex items-center gap-4 rounded-3xl border border-border/60 bg-white p-5 transition-colors hover:border-primary/40"
          >
            <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-accent/40 font-editorial text-primary text-xl">
              {brand.name.charAt(0)}
            </span>
            <div className="min-w-0">
              <p className="flex items-center gap-1 truncate font-semibold text-ink text-sm transition-colors group-hover:text-primary">
                {brand.name}
                <BadgeCheck size={13} className="shrink-0 text-primary" />
              </p>
              <p className="text-foreground/55 text-xs">
                {brand.productCount}{" "}
                {brand.productCount === 1 ? "product" : "products"}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
