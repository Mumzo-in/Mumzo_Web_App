import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";

import Breadcrumbs, {
  type BreadcrumbItem,
} from "@/core/components/breadcrumbs";
import {
  applyCategoryFilters,
  CategoryFilterDialog,
  CategoryFilterPanel,
  type CategoryFilterState,
  CategorySort,
  findCategory,
  initialFilterState,
  ProductCard,
  products,
} from "@/modules/catalog";

const searchParamsSchema = z.object({
  q: z.string().optional(),
  cat: z.string().optional(),
});

export const Route = createFileRoute("/search")({
  validateSearch: (search: Record<string, unknown>) =>
    searchParamsSchema.parse(search),
  component: SearchPage,
});

function SearchPage() {
  const { q, cat } = Route.useSearch();
  const category = findCategory(cat);

  const [filters, setFilters] =
    useState<CategoryFilterState>(initialFilterState);

  // Reset filters when query or category changes
  useEffect(() => {
    setFilters(initialFilterState);
  }, []);

  // 1. Filter products based on search keyword 'q' and category slug 'cat'
  const allProducts = useMemo(() => {
    let list = products;
    if (cat) {
      list = list.filter((p) => p.categorySlug === cat);
    }
    if (q) {
      const query = q.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.brand.toLowerCase().includes(query) ||
          p.categorySlug.toLowerCase().includes(query),
      );
    }
    return list;
  }, [q, cat]);

  // 2. Derive filter facets (brands and sizes) from matching products
  const facets = useMemo(() => {
    const brands = category
      ? category.brands
      : [...new Set(allProducts.map((p) => p.brand))];
    const sizes = [
      ...new Set(
        allProducts.map((p) => p.sizes).filter((s): s is string => Boolean(s)),
      ),
    ];
    return { brands, sizes };
  }, [allProducts, category]);

  // 3. Apply active filters and sorting options to the matches list
  const filtered = useMemo(
    () => applyCategoryFilters(allProducts, filters),
    [allProducts, filters],
  );

  // 4. Construct dynamic breadcrumb trail
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
      className="mx-auto max-w-[1280px] px-2 pt-8 pb-8 md:px-0 md:pb-0"
    >
      <Breadcrumbs items={breadcrumbItems} />

      {/* Title + desktop sort */}
      <div className="flex flex-wrap items-end justify-between gap-4 px-4 md:px-0">
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
          onChange={(sort) => setFilters({ ...filters, sort })}
          className="hidden lg:block"
        />
      </div>

      {/* Mobile toolbar — sort + filter inline (filters open in a dialog) */}
      <div className="mt-4 grid grid-cols-2 gap-2 px-4 lg:hidden">
        <CategorySort
          value={filters.sort}
          onChange={(sort) => setFilters({ ...filters, sort })}
        />
        <CategoryFilterDialog
          facets={facets}
          state={filters}
          onChange={setFilters}
          resultCount={filtered.length}
        />
      </div>

      {/* Sidebar + grid — pure CSS responsive (sidebar is desktop-only) */}
      <div className="mt-8 grid grid-cols-1 gap-8 px-4 md:px-0 lg:mt-8 lg:grid-cols-[260px_1fr]">
        <aside className="hidden h-fit self-start lg:sticky lg:top-24 lg:block">
          <CategoryFilterPanel
            facets={facets}
            state={filters}
            onChange={setFilters}
            className="rounded-3xl border border-border/60 bg-card p-6"
          />
        </aside>

        {filtered.length === 0 ? (
          <div className="rounded-3xl border border-border/40 bg-accent/20 p-12 text-center">
            <p className="font-editorial text-2xl text-ink">Nothing matches</p>
            <p className="mt-1 text-foreground/60 text-sm">
              Try loosening the filters.
            </p>
            <button
              type="button"
              onClick={() =>
                setFilters({ ...initialFilterState, sort: filters.sort })
              }
              className="mt-4 cursor-pointer rounded-full bg-primary px-5 py-2.5 font-semibold text-primary-foreground text-sm transition-colors hover:bg-primary/95"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid 3xl:grid-cols-4 grid-cols-2 gap-5 md:grid-cols-3">
            {filtered.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
