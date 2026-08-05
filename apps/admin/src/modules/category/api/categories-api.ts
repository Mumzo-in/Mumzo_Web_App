import type { Category } from "@mumzo/schema";
import { mockDelay, mockDetail } from "@/core/api/mock";
import { products } from "../../product/data/product-data";
import { categories } from "../data/category-data";

/** A category plus its derived product count — never stored on the category. */
export type CategoryWithCount = Category & { productCount: number };

function withProductCount(category: Category): CategoryWithCount {
  return {
    ...category,
    productCount: products.filter(
      (product) => product.categorySlug === category.slug,
    ).length,
  };
}

/** Categories API — real endpoints under `/api/v1/admin/categories`, keyed by slug. */
export async function listCategories(): Promise<CategoryWithCount[]> {
  await mockDelay();
  return [...categories]
    .sort((a, b) => a.position - b.position)
    .map(withProductCount);
}

export function getCategory(slug: string): Promise<CategoryWithCount> {
  const found = categories.find((category) => category.slug === slug);
  return mockDetail(found ? withProductCount(found) : undefined);
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

export async function createCategory(
  input: CategoryInput,
): Promise<{ id: string }> {
  await mockDelay();
  const nextPosition =
    categories.reduce((max, category) => Math.max(max, category.position), 0) +
    1;
  categories.push({
    slug: input.slug as Category["slug"],
    name: input.name,
    tagline: input.tagline ?? "",
    img: input.img ?? "",
    color: input.color ?? "#F6E4D8",
    brands: [],
    position: nextPosition,
    isActive: input.isActive,
    hasSizes: input.hasSizes,
  });
  return { id: input.slug };
}

export async function updateCategory(
  slug: string,
  input: Partial<Omit<CategoryInput, "slug">>,
): Promise<{ ok: true }> {
  await mockDelay();
  const index = categories.findIndex((category) => category.slug === slug);
  if (index === -1) {
    const { ApiError } = await import("@/core/api/client");
    throw new ApiError("NOT_FOUND", "That record doesn't exist.", 404);
  }
  const current = categories[index];
  categories[index] = {
    ...current,
    name: input.name ?? current.name,
    tagline: input.tagline ?? current.tagline,
    img: input.img ?? current.img,
    color: input.color ?? current.color,
    isActive: input.isActive ?? current.isActive,
    hasSizes: input.hasSizes ?? current.hasSizes,
  };
  return { ok: true };
}

export async function reorderCategories(
  slugs: string[],
): Promise<{ ok: true }> {
  await mockDelay();
  const bySlug = new Map(
    categories.map((category) => [category.slug, category]),
  );
  const reordered = slugs
    .map((slug, index) => {
      const category = bySlug.get(slug as Category["slug"]);
      return category ? { ...category, position: index + 1 } : null;
    })
    .filter((category): category is Category => category !== null);
  categories.splice(0, categories.length, ...reordered);
  return { ok: true };
}

export async function deleteCategory(slug: string): Promise<{ ok: true }> {
  await mockDelay();
  const index = categories.findIndex((category) => category.slug === slug);
  if (index === -1) {
    const { ApiError } = await import("@/core/api/client");
    throw new ApiError("NOT_FOUND", "That record doesn't exist.", 404);
  }
  categories.splice(index, 1);
  return { ok: true };
}
