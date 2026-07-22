import { apiRequest } from "@/core/api/client";

/**
 * Public category shape returned by `GET /api/v1/categories` — see
 * `apps/server/src/modules/platform/v1/categories/categories.schema.ts`.
 * Slug is a plain string here (not `@mumzo/schema`'s closed `CategorySlug`
 * union) since it comes live from the database.
 */
export type PublicCategory = {
  slug: string;
  name: string;
  tagline: string | null;
  img: string | null;
  color: string | null;
  hasSizes: boolean;
  brands: string[];
};

/** Live categories API — real endpoint under `/api/v1/categories`, keyed by slug. */
export function listCategories(): Promise<PublicCategory[]> {
  return apiRequest<PublicCategory[]>("/categories");
}

export function getCategory(slug: string): Promise<PublicCategory> {
  return apiRequest<PublicCategory>(`/categories/${slug}`);
}
