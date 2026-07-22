import { Skeleton } from "@mumzo/ui/components/skeleton";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { BadgeCheck } from "lucide-react";

import Breadcrumbs from "@/core/components/breadcrumbs";
import {
  brandQueryOptions,
  brandsQueryOptions,
  ProductCard,
  productsQueryOptions,
  toProduct,
} from "@/modules/catalog";

export const Route = createFileRoute("/(store)/brand/$brand")({
  component: BrandPage,
});

/** Stable keys for the loading skeleton grid — never reordered. */
const BRAND_SKELETON_KEYS = [
  "sk-1",
  "sk-2",
  "sk-3",
  "sk-4",
  "sk-5",
  "sk-6",
  "sk-7",
  "sk-8",
];

function BrandPage() {
  const { brand: brandSlugParam } = Route.useParams();
  const {
    data: brand,
    isPending,
    isError,
  } = useQuery(brandQueryOptions(brandSlugParam));
  const { data: allBrands = [] } = useQuery(brandsQueryOptions);

  if (isPending) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 pt-8 pb-16">
        <p className="text-foreground/60 text-sm">Loading brand…</p>
      </div>
    );
  }

  if (isError || !brand) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 pt-8 pb-16">
        <p className="text-foreground/60 text-sm">Brand not found.</p>
        <Link
          to="/brand"
          className="mt-2 inline-block font-semibold text-primary text-sm hover:underline"
        >
          Back to all brands →
        </Link>
      </div>
    );
  }

  const { data: productsPage, isLoading: productsLoading } = useQuery(
    productsQueryOptions({ brands: [brand.slug], limit: 60 }),
  );
  const products = (productsPage?.data ?? []).map(toProduct);
  const others = allBrands.filter((b) => b.slug !== brand.slug);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pt-8 pb-16">
      <Breadcrumbs
        items={[
          { label: "Home", to: "/" },
          { label: "Brands", to: "/brand" },
          { label: brand.name },
        ]}
      />

      <section className="mb-8 flex flex-wrap items-center gap-5 rounded-3xl border border-border/60 bg-blush/40 p-6 sm:p-8">
        <span className="flex size-20 shrink-0 items-center justify-center rounded-full bg-white font-editorial text-3xl text-primary shadow-warm">
          {brand.name.charAt(0)}
        </span>
        <div className="flex-1">
          <p className="flex items-center gap-1.5 font-semibold text-[11px] text-primary uppercase tracking-widest">
            <BadgeCheck size={13} />
            Authorised brand
          </p>
          <h1 className="mt-1.5 font-editorial text-4xl text-ink leading-tight tracking-tight sm:text-5xl">
            {brand.name}
          </h1>
          <p className="mt-1.5 text-foreground/60 text-sm">
            {brand.productCount}{" "}
            {brand.productCount === 1 ? "product" : "products"} on Mumzo
          </p>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
        {productsLoading
          ? BRAND_SKELETON_KEYS.map((key) => (
              <Skeleton key={key} className="aspect-square rounded-2xl" />
            ))
          : products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
      </div>

      <section className="mt-14">
        <div className="mb-5 flex items-baseline justify-between">
          <h2 className="font-editorial text-2xl text-ink">Other brands</h2>
          <Link
            to="/brand"
            className="font-semibold text-primary text-sm hover:underline"
          >
            All brands →
          </Link>
        </div>
        <div className="flex flex-wrap gap-2">
          {others.map((b) => (
            <Link
              key={b.slug}
              to="/brand/$brand"
              params={{ brand: b.slug }}
              className="rounded-full border border-border bg-white px-4 py-2 font-semibold text-foreground/70 text-sm transition-colors hover:border-primary/40 hover:text-primary"
            >
              {b.name}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
