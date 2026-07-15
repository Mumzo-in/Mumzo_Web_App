import { Link } from "@tanstack/react-router";

import type { Collection } from "../../data/collection-data";

export default function CollectionCard({
  collection,
}: {
  collection: Collection;
}) {
  return (
    <Link
      to="/collection/$slug"
      params={{ slug: collection.slug }}
      data-testid={`web-collection-${collection.slug}`}
      className="group relative min-w-[240px] flex-1 overflow-hidden rounded-3xl border border-border/60"
    >
      <img
        src={collection.img}
        alt={collection.name}
        loading="lazy"
        className="h-40 w-full object-cover transition-transform duration-700 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-ink/75 to-ink/10" />
      <div className="absolute inset-0 flex flex-col justify-end p-4">
        <p className="font-semibold text-[10px] text-white/75 uppercase tracking-widest">
          {collection.tagline}
        </p>
        <p className="mt-1 font-editorial text-white text-xl leading-tight">
          {collection.name}
        </p>
      </div>
    </Link>
  );
}
