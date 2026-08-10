import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import SectionHeader from "@/core/components/section-header";
import {
  BrandCard,
  BrandGridSkeleton,
  brandsQueryOptions,
  CategoryCard,
  CategoryGridSkeleton,
  CollectionCard,
  categoriesQueryOptions,
  collections,
  ProductCard,
  ProductGridSkeleton,
  ProductRail,
  ProductRailSkeleton,
  productsQueryOptions,
  toProduct,
} from "@/modules/catalog";
import { HeroCarousel } from "@/modules/home";

export const Route = createFileRoute("/(store)/")({
  component: HomePage,
});

// const VALUE_PROPS = [
//   {
//     icon: Clock,
//     title: "10-minute delivery",
//     body: "From our Hyderabad stores",
//   },
//   { icon: BadgeCheck, title: "100% genuine", body: "Authorised brands only" },
//   { icon: Leaf, title: "Gentle & safe", body: "Expiry & batch checked" },
// ];

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
  const { data: categories = [], isLoading: categoriesLoading } = useQuery(
    categoriesQueryOptions,
  );
  const { data: brands = [], isLoading: brandsLoading } =
    useQuery(brandsQueryOptions);

  // Each rail is its own small, targeted server-side query — filtered in SQL
  // (see products.repo.ts `topDeal`/`bestseller` filters, both admin-curated
  // flags) rather than over-fetching a big page and computing rails
  // client-side.
  const { data: topDealsPage, isLoading: topDealsLoading } = useQuery(
    productsQueryOptions({ limit: 10, topDeal: true, sort: "discount" }),
  );
  const { data: bestsellersPage, isLoading: bestsellersLoading } = useQuery(
    productsQueryOptions({ limit: 10, bestseller: true }),
  );
  const { data: picksPage, isLoading: picksLoading } = useQuery(
    productsQueryOptions({ limit: 10 }),
  );

  const topDeals = useMemo(
    () => (topDealsPage?.data ?? []).map(toProduct),
    [topDealsPage],
  );
  const bestsellers = useMemo(
    () => (bestsellersPage?.data ?? []).map(toProduct),
    [bestsellersPage],
  );
  const picks = useMemo(
    () => (picksPage?.data ?? []).map(toProduct),
    [picksPage],
  );

  return (
    <div className="pb-16">
      {/* Hero — carousel (content is CMS-driven via HeroCarousel slides) */}
      <div className="mt-6 lg:mt-10">
        <HeroCarousel />
      </div>

      {/* Value props
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
      </section> */}

      {/* Shop by category */}
      <section className="mt-12">
        <SectionHeader
          kicker="The Shelf"
          title="Shop by category"
          action={
            <span className="shrink-0 text-foreground/50 text-sm">
              {categoriesLoading ? "" : `${categories.length} categories`}
            </span>
          }
        />
        {categoriesLoading ? (
          <CategoryGridSkeleton />
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
            {categories.map((c) => (
              <CategoryCard key={c.slug} category={c} />
            ))}
          </div>
        )}
      </section>

      {/* Product section 1 — Top deals */}
      <section className="mt-12">
        <SectionHeader
          kicker="Save big"
          title="Top deals today"
          action={<SeeAll />}
        />
        {topDealsLoading ? (
          <ProductRailSkeleton />
        ) : (
          <ProductRail products={topDeals} />
        )}
      </section>

      {/* Offers */}
      {/* <section className="mt-12">
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
      </section> */}

      {/* Product section 2 — Bestsellers */}
      <section className="mt-12">
        <SectionHeader
          kicker="Loved by mumzos"
          title="Bestsellers this week"
          action={<SeeAll />}
        />
        {bestsellersLoading ? (
          <ProductRailSkeleton />
        ) : (
          <ProductRail products={bestsellers} />
        )}
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
        {brandsLoading ? (
          <BrandGridSkeleton />
        ) : (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {brands.slice(0, 12).map((b) => (
              <BrandCard key={b.slug} brand={b} />
            ))}
          </div>
        )}
      </section>

      {/* Closing product grid — two rows + view more */}
      <section className="mt-12">
        <SectionHeader kicker="Just for you" title="More to explore" />
        {picksLoading ? (
          <ProductGridSkeleton />
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
            {picks.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
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
