import { mockDetail } from "@/core/api/mock";
import {
  type AdminCategory,
  findCategory,
  orderedCategories,
} from "../data/category-data";

/**
 * Categories API — api-plan §15c. Keyed by slug, not id.
 * The list is unpaginated by design: the taxonomy is small and the screen
 * supports drag-reorder, which paging would break.
 */
export function listCategories(): Promise<AdminCategory[]> {
  return mockDetail(orderedCategories());
}

export function getCategory(slug: string): Promise<AdminCategory> {
  return mockDetail(findCategory(slug));
}
