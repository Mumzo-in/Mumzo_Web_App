import type { Category } from "@mumzo/catalog-model";
import { mockDetail } from "@/core/api/mock";
import { products } from "@/modules/catalog-products";
import { findCategory, orderedCategories } from "../data/category-data";

/** A category plus its derived product count — never stored on the category. */
export type CategoryWithCount = Category & { productCount: number };

/**
 * Categories API — api-plan §15c. Keyed by slug, not id.
 * The list is unpaginated by design: the taxonomy is small and the screen
 * supports drag-reorder, which paging would break.
 */
export function listCategories(): Promise<CategoryWithCount[]> {
  const counts = products.reduce<Record<string, number>>((acc, product) => {
    acc[product.categorySlug] = (acc[product.categorySlug] ?? 0) + 1;
    return acc;
  }, {});

  return mockDetail(
    orderedCategories().map((category) => ({
      ...category,
      productCount: counts[category.slug] ?? 0,
    })),
  );
}

export function getCategory(slug: string): Promise<Category> {
  return mockDetail(findCategory(slug));
}
