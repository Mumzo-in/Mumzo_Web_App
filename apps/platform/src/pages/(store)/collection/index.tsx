import { createFileRoute, Link } from "@tanstack/react-router";

import Breadcrumbs from "@/core/components/breadcrumbs";
import { collections, productsInCollection } from "@/modules/catalog";

export const Route = createFileRoute("/(store)/collection/")({
  component: CollectionsIndexPage,
});

function CollectionsIndexPage() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 pt-8 pb-16">
      <Breadcrumbs
        items={[{ label: "Home", to: "/" }, { label: "Collections" }]}
      />

      <div className="mb-8 rounded-3xl border border-border/60 bg-sage/40 p-8">
        <p className="kicker text-primary">Curated for you</p>
        <h1 className="mt-3 font-editorial text-4xl text-ink leading-tight tracking-tight sm:text-5xl">
          Collections
        </h1>
        <p className="mt-3 max-w-xl text-foreground/70 leading-relaxed">
          Hand-picked edits for every stage — from the first week home to the
          first day of play.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {collections.map((collection) => {
          const count = productsInCollection(collection.slug).length;
          return (
            <Link
              key={collection.slug}
              to="/collection/$slug"
              params={{ slug: collection.slug }}
              data-testid={`web-collection-${collection.slug}`}
              className="group overflow-hidden rounded-3xl border border-border/60 bg-white transition-colors hover:border-primary/40"
            >
              <div className="relative">
                <img
                  src={collection.img}
                  alt={collection.name}
                  loading="lazy"
                  className="h-44 w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/70 to-ink/5" />
                <div className="absolute inset-0 flex flex-col justify-end p-5">
                  <p className="font-semibold text-[10px] text-white/75 uppercase tracking-widest">
                    {collection.tagline}
                  </p>
                  <p className="mt-1 font-editorial text-2xl text-white leading-tight">
                    {collection.name}
                  </p>
                </div>
              </div>
              <div className="p-5">
                <p className="text-foreground/70 text-sm leading-relaxed">
                  {collection.description}
                </p>
                <p className="mt-3 font-semibold text-primary text-xs">
                  {count} {count === 1 ? "product" : "products"} →
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
