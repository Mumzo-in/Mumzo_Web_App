import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { BadgeCheck } from "lucide-react";

import Breadcrumbs from "@/core/components/breadcrumbs";
import {
  brands,
  findBrand,
  ProductCard,
  productsByBrand,
} from "@/modules/catalog";

export const Route = createFileRoute("/(store)/brand/$brand")({
  component: BrandPage,
  loader: ({ params }) => {
    const brand = findBrand(params.brand);
    if (!brand) throw notFound();
    return { brand, products: productsByBrand(params.brand) };
  },
});

function BrandPage() {
  const { brand, products } = Route.useLoaderData();
  const others = brands.filter((b) => b.slug !== brand.slug);

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
        {products.map((product) => (
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
