import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import Breadcrumbs from "@/core/components/breadcrumbs";
import {
  applyCategoryFilters,
  CategoryFilterDialog,
  CategoryFilterPanel,
  type CategoryFilterState,
  CategorySort,
  findCategory,
  getCategoryFacets,
  initialFilterState,
  ProductCard,
  productsInCategory,
} from "@/modules/catalog";

export const Route = createFileRoute("/category/$slug")({
  component: CategoryPage,
});

function CategoryPage() {
  const { slug } = Route.useParams();
  const category = findCategory(slug);
  const allProducts = productsInCategory(slug);

  const [filters, setFilters] =
    useState<CategoryFilterState>(initialFilterState);

  const facets = useMemo(
    () =>
      category
        ? getCategoryFacets(category, allProducts)
        : { brands: [], sizes: [] },
    [category, allProducts],
  );
  const filtered = useMemo(
    () => applyCategoryFilters(allProducts, filters),
    [allProducts, filters],
  );

  if (!category) {
    return (
      <div className="mx-auto max-w-[1280px] px-6 py-16 text-center">
        Category not found.
      </div>
    );
  }

  return (
    <div
      data-testid="web-category-page"
      className="mx-auto max-w-[1280px] px-4 pt-8 pb-8 md:px-0 md:pb-0"
    >
      <Breadcrumbs
        items={[
          { label: "Home", to: "/" },
          { label: "Categories" },
          { label: category.name },
        ]}
      />

      {/* Title + desktop sort */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-editorial text-4xl leading-none lg:text-5xl">
            {category.name}
          </h1>
          <p className="mt-2 text-foreground/60 text-sm">
            {filtered.length} products · {category.tagline}
          </p>
        </div>
        <CategorySort
          value={filters.sort}
          onChange={(sort) => setFilters({ ...filters, sort })}
          className="hidden lg:block"
        />
      </div>

      {/* Mobile toolbar — sort + filter inline (filters open in a dialog) */}
      <div className="mt-4 grid grid-cols-2 gap-2 lg:hidden">
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
      <div className="mt-8 grid grid-cols-1 gap-8 lg:mt-8 lg:grid-cols-[260px_1fr]">
        <aside className="hidden h-fit self-start lg:sticky lg:top-24 lg:block">
          <CategoryFilterPanel
            facets={facets}
            state={filters}
            onChange={setFilters}
            className="rounded-3xl border border-border/60 bg-card p-6"
          />
        </aside>

        {filtered.length === 0 ? (
          <div className="rounded-3xl bg-accent/40 p-12 text-center">
            <p className="font-editorial text-2xl">Nothing matches</p>
            <p className="mt-1 text-foreground/60 text-sm">
              Try loosening the filters.
            </p>
            <button
              type="button"
              onClick={() =>
                setFilters({ ...initialFilterState, sort: filters.sort })
              }
              className="mt-4 rounded-full bg-primary px-5 py-2.5 font-semibold text-primary-foreground text-sm"
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
