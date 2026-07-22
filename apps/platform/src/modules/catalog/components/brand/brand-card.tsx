import { Link } from "@tanstack/react-router";
import { BadgeCheck } from "lucide-react";

import type { PublicBrand } from "../../api/brands-api";

export default function BrandCard({ brand }: { brand: PublicBrand }) {
  return (
    <Link
      to="/brand/$brand"
      params={{ brand: brand.slug }}
      data-testid={`web-brand-${brand.slug}`}
      className="group flex flex-col items-center gap-3 rounded-2xl border border-border/60 bg-card p-5 text-center transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-warm"
    >
      <span className="flex size-14 items-center justify-center rounded-full bg-accent/40 font-editorial text-2xl text-primary">
        {brand.name.charAt(0)}
      </span>
      <div className="min-w-0">
        <p className="flex items-center justify-center gap-1 truncate font-semibold text-ink text-sm transition-colors group-hover:text-primary">
          {brand.name}
          <BadgeCheck size={12} className="shrink-0 text-primary" />
        </p>
        <p className="text-foreground/55 text-xs">
          {brand.productCount} {brand.productCount === 1 ? "item" : "items"}
        </p>
      </div>
    </Link>
  );
}
