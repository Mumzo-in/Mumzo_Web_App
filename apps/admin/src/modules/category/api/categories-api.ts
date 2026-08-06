import { apiRequest } from "@/core/api/client";

/** Category shape returned by `/admin/categories` — see api-plan §15c. */
export type CategoryWithCount = {
  slug: string;
  name: string;
  tagline: string | null;
  img: string | null;
  color: string | null;
  position: number;
  isActive: boolean;
  hasSizes: boolean;
  brands: string[];
  productCount: number;
};

export function listCategories(): Promise<CategoryWithCount[]> {
  return apiRequest<CategoryWithCount[]>("/categories");
}

export function getCategory(slug: string): Promise<CategoryWithCount> {
  return apiRequest<CategoryWithCount>(
    `/categories/${encodeURIComponent(slug)}`,
  );
}

export type CategoryInput = {
  slug: string;
  name: string;
  tagline?: string | null;
  img?: string | null;
  color?: string | null;
  isActive: boolean;
  hasSizes: boolean;
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
  return apiRequest<{ ok: true }>(`/categories/${encodeURIComponent(slug)}`, {
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
  return apiRequest<{ ok: true }>(`/categories/${encodeURIComponent(slug)}`, {
    method: "DELETE",
  });
}
