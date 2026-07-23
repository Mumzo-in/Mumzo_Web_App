import { buildKey, toPublicUrl } from "@mumzo/storage";
import { conflict, notFound } from "@/core/errors";
import { finalizeSession } from "../uploads/uploads.service";
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

/**
 * Copies the draft cover (`mumzo/tmp/{sessionId}/cover.webp`) to its final
 * `mumzo/admin/categories/{categoryId}/cover.webp` destination and returns
 * the public URL to store as `img`. No-op when no session was uploaded.
 */
async function finalizeCover(
  categoryId: string,
  uploadSessionId: string | undefined,
  userId: string,
): Promise<string | undefined> {
  if (!uploadSessionId) {
    return undefined;
  }
  const destKey = buildKey("admin", "categories", categoryId, "cover");
  await finalizeSession(uploadSessionId, userId, { cover: destKey });
  return toPublicUrl(destKey);
}

export async function createCategory(
  input: {
    slug: string;
    name: string;
    tagline?: string | null;
    img?: string | null;
    color?: string | null;
    isActive: boolean;
    hasSizes: boolean;
    brandIds: string[];
    uploadSessionId?: string;
  },
  userId: string,
) {
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

  const coverUrl = await finalizeCover(id, input.uploadSessionId, userId);
  if (coverUrl) {
    await categoriesRepo.update(id, { img: coverUrl });
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
    uploadSessionId: string;
  }>,
  userId: string,
) {
  const id = await requireCategoryId(slug);

  const { brandIds, uploadSessionId, ...rest } = input;

  const coverUrl = await finalizeCover(id, uploadSessionId, userId);
  const patch = coverUrl ? { ...rest, img: coverUrl } : rest;

  if (Object.keys(patch).length > 0) {
    await categoriesRepo.update(id, patch);
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
