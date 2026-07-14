import { createFileRoute, Link } from "@tanstack/react-router";
import {
  CategoryCard,
  categories,
  ProductCard,
  products,
} from "@/modules/catalog";
import { HeroCarousel } from "@/modules/home";
import { OffersStrip } from "@/modules/offers";

export const Route = createFileRoute("/(store)/")({
  component: HomePage,
});

function HomePage() {
  const bestsellers = products.filter((p) => p.bestseller).slice(0, 8);

  return (
    <div className="pb-16">
      {/* Hero — carousel (content is CMS-driven via HeroCarousel slides) */}
      <div className="mt-6 lg:mt-10">
        <HeroCarousel />
      </div>

      {/* Categories grid */}
      <section className="mt-16">
        <div className="mb-6 flex items-baseline justify-between">
          <div>
            <span className="font-semibold text-[11px] text-primary uppercase tracking-widest">
              The Shelf
            </span>
            <h2 className="mt-1 font-editorial text-3xl lg:text-4xl">
              Shop by category
            </h2>
          </div>
          <span className="text-foreground/50 text-sm">
            {categories.length} categories
          </span>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
          {categories.map((c) => (
            <CategoryCard key={c.slug} category={c} />
          ))}
        </div>
      </section>

      {/* Offers strip */}
      <section className="mt-12">
        <div className="mb-5 flex items-baseline justify-between">
          <div>
            <span className="font-semibold text-[11px] text-primary uppercase tracking-widest">
              Save more
            </span>
            <h2 className="mt-1 font-editorial text-3xl lg:text-4xl">
              Offers for you
            </h2>
          </div>
          <Link
            to="/offers"
            className="font-semibold text-primary text-sm hover:underline"
          >
            See all →
          </Link>
        </div>
        <OffersStrip />
      </section>

      {/* Bestsellers */}
      <section className="mt-16">
        <div className="mb-6 flex items-baseline justify-between">
          <div>
            <span className="font-semibold text-[11px] text-primary uppercase tracking-widest">
              Loved by mumzos
            </span>
            <h2 className="mt-1 font-editorial text-3xl lg:text-4xl">
              Bestsellers this week
            </h2>
          </div>
          <Link
            to="/search"
            search={{ cat: "baby-food" }}
            className="font-semibold text-primary text-sm hover:underline"
          >
            See all →
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
          {bestsellers.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>
    </div>
  );
}
