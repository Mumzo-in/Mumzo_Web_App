import { discountPct } from "@mumzo/schema";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { BadgeCheck, Clock, Leaf } from "lucide-react";
import { useMemo } from "react";
import SectionHeader from "@/core/components/section-header";
import {
  BrandCard,
  brandsQueryOptions,
  CategoryCard,
  CollectionCard,
  categoriesQueryOptions,
  collections,
  ProductCard,
  ProductRail,
  productsQueryOptions,
  toProduct,
} from "@/modules/catalog";
import { HeroCarousel } from "@/modules/home";
import { OffersStrip } from "@/modules/offers";

export const Route = createFileRoute("/(store)/")({
  component: HomePage,
});

const VALUE_PROPS = [
  {
    icon: Clock,
    title: "10-minute delivery",
    body: "From our Hyderabad stores",
  },
  { icon: BadgeCheck, title: "100% genuine", body: "Authorised brands only" },
  { icon: Leaf, title: "Gentle & safe", body: "Expiry & batch checked" },
];

function SeeAll({ cat, label = "See all" }: { cat?: string; label?: string }) {
  return (
    <Link
      to="/search"
      search={{ cat }}
      className="shrink-0 font-semibold text-primary text-sm hover:underline"
    >
      {label} →
    </Link>
  );
}

function HomePage() {
  const { data: categories = [] } = useQuery(categoriesQueryOptions);
  const { data: brands = [] } = useQuery(brandsQueryOptions);
  // One generous live page backs all three rails below — the catalog is
  // small enough today that a single fetch beats three separate ones.
  const { data: productsPage } = useQuery(productsQueryOptions({ limit: 60 }));
  const products = useMemo(
    () => (productsPage?.data ?? []).map(toProduct),
    [productsPage],
  );
  const bestsellers = products.filter((p) => p.isBestseller).slice(0, 10);
  const topDeals = [...products]
    .filter((p) => discountPct(p) > 0)
    .sort((a, b) => discountPct(b) - discountPct(a))
    .slice(0, 10);
  // Two rows of the responsive grid (5 per row at lg).
  const picks = products.slice(0, 10);

  return (
    <div className="pb-16">
      {/* Hero — carousel (content is CMS-driven via HeroCarousel slides) */}
      <div className="mt-6 lg:mt-10">
        <HeroCarousel />
      </div>

      {/* Value props */}
      <section className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {VALUE_PROPS.map((v) => {
          const Icon = v.icon;
          return (
            <div
              key={v.title}
              className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-4"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent/40 text-primary">
                <Icon size={18} />
              </span>
              <div>
                <p className="font-semibold text-ink text-sm">{v.title}</p>
                <p className="text-foreground/55 text-xs">{v.body}</p>
              </div>
            </div>
          );
        })}
      </section>

      {/* Shop by category */}
      <section className="mt-12">
        <SectionHeader
          kicker="The Shelf"
          title="Shop by category"
          action={
            <span className="shrink-0 text-foreground/50 text-sm">
              {categories.length} categories
            </span>
          }
        />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
          {categories.map((c) => (
            <CategoryCard key={c.slug} category={c} />
          ))}
        </div>
      </section>

      {/* Product section 1 — Top deals */}
      <section className="mt-12">
        <SectionHeader
          kicker="Save big"
          title="Top deals today"
          action={<SeeAll />}
        />
        <ProductRail products={topDeals} />
      </section>

      {/* Offers */}
      <section className="mt-12">
        <SectionHeader
          kicker="Coupons"
          title="Offers for you"
          action={
            <Link
              to="/offers"
              className="shrink-0 font-semibold text-primary text-sm hover:underline"
            >
              See all →
            </Link>
          }
        />
        <OffersStrip />
      </section>

      {/* Product section 2 — Bestsellers */}
      <section className="mt-12">
        <SectionHeader
          kicker="Loved by mumzos"
          title="Bestsellers this week"
          action={<SeeAll />}
        />
        <ProductRail products={bestsellers} />
      </section>

      {/* Collections */}
      <section className="mt-12">
        <SectionHeader
          kicker="Curated for you"
          title="Collections"
          action={
            <Link
              to="/collection"
              className="shrink-0 font-semibold text-primary text-sm hover:underline"
            >
              Explore →
            </Link>
          }
        />
        <div className="no-scrollbar -mx-4 flex gap-4 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0">
          {collections.map((c) => (
            <CollectionCard key={c.slug} collection={c} />
          ))}
        </div>
      </section>

      {/* Brands */}
      <section className="mt-12">
        <SectionHeader
          kicker="Only the genuine"
          title="Shop by brand"
          action={
            <Link
              to="/brand"
              className="shrink-0 font-semibold text-primary text-sm hover:underline"
            >
              All brands →
            </Link>
          }
        />
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {brands.slice(0, 12).map((b) => (
            <BrandCard key={b.slug} brand={b} />
          ))}
        </div>
      </section>

      {/* Closing product grid — two rows + view more */}
      <section className="mt-12">
        <SectionHeader kicker="Just for you" title="More to explore" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
          {picks.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
        <div className="mt-8 flex justify-center">
          <Link
            to="/search"
            className="rounded-full border border-primary/30 px-8 py-3 font-semibold text-primary text-sm transition-colors hover:bg-primary/5"
          >
            View more products
          </Link>
        </div>
      </section>
    </div>
  );
}
