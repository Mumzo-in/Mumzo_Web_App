import { Skeleton } from "@mumzo/ui/components/skeleton";
import { cn } from "@mumzo/ui/lib/utils";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { z } from "zod";

import Breadcrumbs, {
  type BreadcrumbItem,
} from "@/core/components/breadcrumbs";
import { useInfiniteScroll } from "@/core/hooks/use-infinite-scroll";
import {
  applyClientOnlyFilters,
  CategoryFilterDialog,
  CategoryFilterPanel,
  type CategoryFilterState,
  CategorySort,
  categoriesQueryOptions,
  categoryOgImage,
  defaultOgImage,
  getCategoryFacets,
  initialFilterState,
  PRICE_MAX,
  PRICE_MIN,
  ProductCard,
  productsInfiniteQueryOptions,
  productsQueryOptions,
  toProduct,
} from "@/modules/catalog";
import type { AgeGroup } from "@/modules/catalog/data/product-attributes";

/** Comma-joined list ↔ string[] — matches the convention already used to
 * send `brands`/`sizes` to the API (`products-api.ts`'s `.join(",")`). */
function csv(value: string | undefined): string[] {
  return value
    ? value
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean)
    : [];
}

const SORT_KEYS = [
  "relevance",
  "price_asc",
  "price_desc",
  "discount",
  "rating",
] as const;

const AGE_KEYS = ["0-6m", "6-12m", "1-2y", "2-4y", "4y+", "mom"] as const;

/**
 * Every filter/search/sort control on this page lives in the URL, not local
 * state — shareable/bookmarkable/back-button-correct. Every field stays
 * optional (no defaults baked in here) so `<Link to="/search" search={{ cat }}>`
 * elsewhere in the app (footer, home, PDP breadcrumb, header search bar)
 * keeps working with a partial search object — `toFilterState` below fills
 * in `initialFilterState` defaults for actual use inside this page. Arrays
 * serialize as comma-joined strings, consistent with how `products-api.ts`
 * already sends `brands`/`sizes` to the API.
 */
const searchParamsSchema = z.object({
  q: z.string().optional(),
  cat: z.string().optional(),
  sort: z.enum(SORT_KEYS).optional(),
  ages: z.string().optional(),
  brands: z.string().optional(),
  sizes: z.string().optional(),
  colors: z.string().optional(),
  types: z.string().optional(),
  priceMin: z.coerce.number().int().nonnegative().optional(),
  priceMax: z.coerce.number().int().positive().optional(),
});

type SearchParams = z.infer<typeof searchParamsSchema>;

/** Stable keys for the loading skeleton grid — never reordered. */
const SKELETON_KEYS = [
  "sk-1",
  "sk-2",
  "sk-3",
  "sk-4",
  "sk-5",
  "sk-6",
  "sk-7",
  "sk-8",
];

export const Route = createFileRoute("/(store)/search")({
  validateSearch: (search: Record<string, unknown>) =>
    searchParamsSchema.parse(search),
  component: SearchPage,
  head: ({ match }) => ({
    meta: [
      {
        property: "og:image",
        content: match.search.cat
          ? categoryOgImage(match.search.cat)
          : defaultOgImage(),
      },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

/** URL search params → the shared `CategoryFilterState` shape the filter
 * panel/dialog/sort components already render against — fills in
 * `initialFilterState` defaults for whatever's absent from the URL (every
 * field is optional in `searchParamsSchema` so other routes can link here
 * with a partial search object). Brand values here are *slugs* (server/URL
 * identity); translated to display names for the panel via `panelState`
 * below, since facets/checkboxes key on display name. */
function toFilterState(search: SearchParams): CategoryFilterState {
  return {
    sort: search.sort ?? initialFilterState.sort,
    ages: csv(search.ages).filter((a): a is AgeGroup =>
      (AGE_KEYS as readonly string[]).includes(a),
    ),
    brands: csv(search.brands),
    sizes: csv(search.sizes),
    colors: csv(search.colors),
    types: csv(search.types),
    price:
      search.priceMin !== undefined && search.priceMax !== undefined
        ? { min: search.priceMin, max: search.priceMax }
        : initialFilterState.price,
  };
}

function SearchPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const { q, cat } = search;

  const { data: categories = [] } = useQuery(categoriesQueryOptions);
  const category = cat
    ? (categories.find((c) => c.slug === cat) ?? null)
    : null;

  // Facet query — cat + search only, unfiltered by sort/brand/price/size, so
  // facets (and the brand slug↔name map) reflect the *whole* matching set,
  // not just what's currently selected.
  const { data: facetPage } = useQuery(
    productsQueryOptions({ categorySlug: cat, search: q, limit: 100 }),
  );
  const facetProducts = useMemo(
    () => (facetPage?.data ?? []).map(toProduct),
    [facetPage],
  );
  const facets = useMemo(
    () => getCategoryFacets(facetProducts),
    [facetProducts],
  );

  // Brand slugs are the URL/API identity; the filter panel's checkboxes key
  // on display name (from `getCategoryFacets`) — bridge the two.
  const brandSlugToName = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of facetProducts) {
      map.set(p.brandId, p.brand);
    }
    return map;
  }, [facetProducts]);
  const brandNameToSlug = useMemo(() => {
    const map = new Map<string, string>();
    for (const [slug, name] of brandSlugToName) {
      map.set(name, slug);
    }
    return map;
  }, [brandSlugToName]);

  const filters = useMemo(() => toFilterState(search), [search]);
  // Panel/dialog compare against display names — translate URL slugs.
  const panelState: CategoryFilterState = useMemo(
    () => ({
      ...filters,
      brands: filters.brands
        .map((slug) => brandSlugToName.get(slug))
        .filter((name): name is string => Boolean(name)),
    }),
    [filters, brandSlugToName],
  );

  /** Writes the full filter state back to the URL. `replace: true` so
   * filter tweaks don't spam back-button history — only the initial
   * category/search navigation (via `CategoryCard`/`CategoryLink`/the
   * header search box, all outside this page) pushes a normal entry. */
  const updateFilters = (next: CategoryFilterState) => {
    navigate({
      search: (prev) => ({
        ...prev,
        sort: next.sort,
        ages: next.ages.length > 0 ? next.ages.join(",") : undefined,
        brands:
          next.brands.length > 0
            ? next.brands
                .map((name) => brandNameToSlug.get(name) ?? name)
                .join(",")
            : undefined,
        sizes: next.sizes.length > 0 ? next.sizes.join(",") : undefined,
        colors: next.colors.length > 0 ? next.colors.join(",") : undefined,
        types: next.types.length > 0 ? next.types.join(",") : undefined,
        priceMin: next.price?.min,
        priceMax: next.price?.max,
      }),
      replace: true,
    });
  };

  const updateSort = (sort: CategoryFilterState["sort"]) =>
    updateFilters({ ...filters, sort });

  const selectCategory = (slug: string | undefined) => {
    navigate({
      search: (prev) => ({ ...prev, cat: slug }),
      replace: true,
    });
  };

  // Live products for this category/search — server now applies
  // categorySlug/search/sort/brands(slugs)/sizes/maxPrice. Only `ages`/
  // `types` still run client-side (the public API has no facet for them
  // yet — see `applyClientOnlyFilters`'s doc comment). Infinite-scrolled:
  // 20 products per page instead of fetching everything up front.
  const {
    data: infiniteData,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery(
    productsInfiniteQueryOptions({
      categorySlug: cat,
      search: q,
      sort: filters.sort,
      brands: filters.brands,
      sizes: filters.sizes,
      minPrice:
        filters.price && filters.price.min > PRICE_MIN
          ? filters.price.min
          : undefined,
      maxPrice:
        filters.price && filters.price.max < PRICE_MAX
          ? filters.price.max
          : undefined,
    }),
  );

  const sentinelRef = useInfiniteScroll({
    hasNextPage: hasNextPage ?? false,
    isFetchingNextPage,
    fetchNextPage,
  });

  const serverFiltered = useMemo(
    () => (infiniteData?.pages ?? []).flatMap((p) => p.data.map(toProduct)),
    [infiniteData],
  );
  const filtered = useMemo(
    () => applyClientOnlyFilters(serverFiltered, filters),
    [serverFiltered, filters],
  );

  // Construct dynamic breadcrumb trail
  const breadcrumbItems = useMemo(() => {
    const base: BreadcrumbItem[] = [{ label: "Home", to: "/" }];
    if (category) {
      base.push({ label: "Categories" });
      base.push({ label: category.name });
    } else if (q) {
      base.push({ label: "Search" });
      base.push({ label: `Results for "${q}"` });
    } else {
      base.push({ label: "Shop" });
    }
    return base;
  }, [category, q]);

  const title = category
    ? category.name
    : q
      ? `Results for "${q}"`
      : "Shop All";
  const tagline = category
    ? category.tagline
    : `${filtered.length} products matches search`;

  return (
    <div
      data-testid="web-category-page"
      className="mx-auto max-w-7xl px-2 pt-8 pb-8 md:px-0 md:pb-0"
    >
      <Breadcrumbs items={breadcrumbItems} />

      {/* Title + desktop sort */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-editorial text-4xl text-ink leading-none lg:text-5xl">
            {title}
          </h1>
          <p className="mt-2 text-foreground/60 text-sm">
            {filtered.length} products · {tagline}
          </p>
        </div>
        <CategorySort
          value={filters.sort}
          onChange={updateSort}
          className="hidden lg:flex"
        />
      </div>

      {/* Category chips — inline switcher, no full navigation away from
          /search. Highlights the active category via the `cat` param. */}
      {categories.length > 0 && (
        <div
          data-testid="web-category-nav"
          className="mt-6 flex gap-2 overflow-x-auto pb-1"
        >
          <button
            type="button"
            onClick={() => selectCategory(undefined)}
            data-testid="web-category-chip-all"
            className={cn(
              "shrink-0 cursor-pointer whitespace-nowrap rounded-full border px-4 py-2 font-medium text-sm transition-colors",
              !cat
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border/70 bg-card text-foreground hover:border-primary",
            )}
          >
            All
          </button>
          {categories.map((c) => (
            <button
              key={c.slug}
              type="button"
              onClick={() => selectCategory(c.slug)}
              data-testid={`web-category-chip-${c.slug}`}
              className={cn(
                "shrink-0 cursor-pointer whitespace-nowrap rounded-full border px-4 py-2 font-medium text-sm transition-colors",
                cat === c.slug
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border/70 bg-card text-foreground hover:border-primary",
              )}
            >
              {c.name}
            </button>
          ))}
        </div>
      )}

      {/* Mobile toolbar — sort + filter inline (filters open in a dialog) */}
      <div className="mt-4 grid grid-cols-2 gap-2 md:px-4 lg:hidden">
        <CategorySort value={filters.sort} onChange={updateSort} />
        <CategoryFilterDialog
          facets={facets}
          state={panelState}
          onChange={updateFilters}
          resultCount={filtered.length}
        />
      </div>

      {/* Sidebar + grid — pure CSS responsive (sidebar is desktop-only) */}
      <div className="mt-8 grid grid-cols-1 gap-8 lg:mt-8 lg:grid-cols-[260px_1fr]">
        <aside className="hidden self-start lg:sticky lg:top-24 lg:block">
          <CategoryFilterPanel
            facets={facets}
            state={panelState}
            onChange={updateFilters}
            className="max-h-[calc(100vh-7rem)] overflow-y-auto rounded-3xl border border-border/60 bg-card"
          />
        </aside>

        {isLoading ? (
          <div className="grid 3xl:grid-cols-4 grid-cols-2 gap-5 md:grid-cols-3">
            {SKELETON_KEYS.map((key) => (
              <Skeleton key={key} className="aspect-square rounded-2xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-3xl border border-border/40 bg-accent/20 p-12 text-center">
            <p className="font-editorial text-2xl text-ink">Nothing matches</p>
            <p className="mt-1 text-foreground/60 text-sm">
              Try loosening the filters.
            </p>
            <button
              type="button"
              onClick={() =>
                updateFilters({ ...initialFilterState, sort: filters.sort })
              }
              className="mt-4 cursor-pointer rounded-full bg-primary px-5 py-2.5 font-semibold text-primary-foreground text-sm transition-colors hover:bg-primary/95"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <>
            <div className="grid 3xl:grid-cols-4 grid-cols-2 gap-5 md:grid-cols-3">
              {filtered.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {/* Sentinel — fetches the next 20 once this scrolls into view. */}
            <div ref={sentinelRef} className="h-1" />

            {isFetchingNextPage && (
              <div className="mt-5 grid 3xl:grid-cols-4 grid-cols-2 gap-5 md:grid-cols-3">
                {SKELETON_KEYS.slice(0, 4).map((key) => (
                  <Skeleton
                    key={`next-${key}`}
                    className="aspect-square rounded-2xl"
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
