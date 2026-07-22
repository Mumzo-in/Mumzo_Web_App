import { conflict, notFound } from "@/core/errors";
import * as categoriesRepo from "./categories.repo";

export async function listCategories() {
  return categoriesRepo.findAll();
}

export async function getCategory(slug: string) {
  const category = await categoriesRepo.findBySlug(slug);
  if (!category) {
    throw notFound("Category");
  }
  return category;
}

export async function createCategory(input: {
  slug: string;
  name: string;
  tagline?: string | null;
  img?: string | null;
  color?: string | null;
  isActive: boolean;
  hasSizes: boolean;
  brandIds: string[];
}) {
  const existing = await categoriesRepo.findIdBySlug(input.slug);
  if (existing) {
    throw conflict(`The slug "${input.slug}" is already in use.`);
  }

  const position = (await categoriesRepo.maxPosition()) + 1;

  const id = await categoriesRepo.insert({
    slug: input.slug,
    name: input.name,
    tagline: input.tagline ?? null,
    img: input.img ?? null,
    color: input.color ?? null,
    isActive: input.isActive,
    hasSizes: input.hasSizes,
    position,
  });

  if (input.brandIds.length > 0) {
    await categoriesRepo.setBrands(id, input.brandIds);
  }

  return id;
}

async function requireCategoryId(slug: string) {
  const row = await categoriesRepo.findIdBySlug(slug);
  if (!row) {
    throw notFound("Category");
  }
  return row.id;
}

export async function updateCategory(
  slug: string,
  input: Partial<{
    name: string;
    tagline: string | null;
    img: string | null;
    color: string | null;
    isActive: boolean;
    hasSizes: boolean;
    brandIds: string[];
  }>,
) {
  const id = await requireCategoryId(slug);

  const { brandIds, ...rest } = input;

  if (Object.keys(rest).length > 0) {
    await categoriesRepo.update(id, rest);
  }
  if (brandIds !== undefined) {
    await categoriesRepo.setBrands(id, brandIds);
  }
}

export async function deleteCategory(slug: string) {
  const id = await requireCategoryId(slug);

  const inUse = await categoriesRepo.productCountFor(id);
  if (inUse > 0) {
    throw conflict(
      `${inUse} product(s) still use this category. Reassign them first.`,
    );
  }

  await categoriesRepo.remove(id);
}

export async function reorderCategories(slugs: string[]) {
  const slugToPosition = new Map(slugs.map((slug, index) => [slug, index + 1]));
  await categoriesRepo.reorder(slugToPosition);
}
