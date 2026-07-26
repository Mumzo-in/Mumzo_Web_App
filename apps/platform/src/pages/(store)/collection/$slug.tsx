import { createFileRoute, Link, notFound } from "@tanstack/react-router";

import Breadcrumbs from "@/core/components/breadcrumbs";
import {
  collections,
  findCollection,
  ProductCard,
  productsInCollection,
} from "@/modules/catalog";

export const Route = createFileRoute("/(store)/collection/$slug")({
  component: CollectionPage,
  loader: ({ params }) => {
    const collection = findCollection(params.slug);
    if (!collection) throw notFound();
    return { collection, products: productsInCollection(params.slug) };
  },
});

function CollectionPage() {
  const { collection, products } = Route.useLoaderData();
  const others = collections.filter((c) => c.slug !== collection.slug);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pt-8 pb-16">
      <Breadcrumbs
        items={[
          { label: "Home", to: "/" },
          { label: "Collections" },
          { label: collection.name },
        ]}
      />

      <section className="relative mb-8 overflow-hidden rounded-3xl border border-border/60">
        <img
          src={collection.img}
          alt={collection.name}
          className="h-56 w-full object-cover sm:h-72"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-ink/70 to-ink/20" />
        <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-10">
          <p className="font-semibold text-[11px] text-white/80 uppercase tracking-widest">
            {collection.tagline}
          </p>
          <h1 className="mt-2 font-editorial text-4xl text-white leading-tight tracking-tight sm:text-5xl">
            {collection.name}
          </h1>
          <p className="mt-2 max-w-xl text-sm text-white/80 leading-relaxed">
            {collection.description}
          </p>
        </div>
      </section>

      <p className="mb-5 text-foreground/60 text-sm">
        {products.length} {products.length === 1 ? "product" : "products"}
      </p>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      <section className="mt-14">
        <h2 className="mb-5 font-editorial text-2xl text-ink">
          More collections
        </h2>
        <div className="no-scrollbar flex gap-4 overflow-x-auto pb-1">
          {others.map((c) => (
            <Link
              key={c.slug}
              to="/collection/$slug"
              params={{ slug: c.slug }}
              className="group relative w-[240px] shrink-0 overflow-hidden rounded-3xl border border-border/60"
            >
              <img
                src={c.img}
                alt={c.name}
                className="h-32 w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-ink/45" />
              <div className="absolute inset-0 flex flex-col justify-end p-4">
                <p className="font-editorial text-lg text-white leading-tight">
                  {c.name}
                </p>
                <p className="text-white/70 text-xs">{c.tagline}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
