import type { Category } from "@mumzo/schema";
import { apiRequest } from "@/core/api/client";

/** A category plus its derived product count — never stored on the category. */
export type CategoryWithCount = Category & { productCount: number };

/** Categories API — real endpoints under `/api/v1/admin/categories`, keyed by slug. */
export function listCategories(): Promise<CategoryWithCount[]> {
  return apiRequest<CategoryWithCount[]>("/categories");
}

export function getCategory(slug: string): Promise<CategoryWithCount> {
  return apiRequest<CategoryWithCount>(`/categories/${slug}`);
}

export type CategoryInput = {
  slug: string;
  name: string;
  tagline?: string | null;
  img?: string | null;
  color?: string | null;
  isActive: boolean;
  hasSizes: boolean;
  brandIds: string[];
  /** Draft upload session carrying a new cover image, if one was uploaded. */
  uploadSessionId?: string;
};

export function createCategory(input: CategoryInput): Promise<{ id: string }> {
  return apiRequest<{ id: string }>("/categories", {
    method: "POST",
    body: input,
  });
}

export function updateCategory(
  slug: string,
  input: Partial<Omit<CategoryInput, "slug">>,
): Promise<{ ok: true }> {
  return apiRequest<{ ok: true }>(`/categories/${slug}`, {
    method: "PATCH",
    body: input,
  });
}

export function reorderCategories(slugs: string[]): Promise<{ ok: true }> {
  return apiRequest<{ ok: true }>("/categories/reorder", {
    method: "PUT",
    body: { slugs },
  });
}

export function deleteCategory(slug: string): Promise<{ ok: true }> {
  return apiRequest<{ ok: true }>(`/categories/${slug}`, {
    method: "DELETE",
  });
}
