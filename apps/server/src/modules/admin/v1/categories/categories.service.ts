import { buildKey, toPublicUrl } from "@mumzo/storage";
import type { Context } from "hono";
import { logActivity } from "@/core";
import { conflict, notFound } from "@/core/errors";
import type { AppEnv } from "@/core/types";
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
 * `mumzo/platform/categories/{categoryId}/cover.webp` destination and
 * returns the public URL to store as `img`. No-op when no session was
 * uploaded.
 */
async function finalizeCover(
  categoryId: string,
  uploadSessionId: string | undefined,
  userId: string,
): Promise<string | undefined> {
  if (!uploadSessionId) {
    return undefined;
  }
  const destKey = buildKey("platform", "categories", categoryId, "cover");
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
  c?: Context<AppEnv>,
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

  if (c) {
    await logActivity({
      c,
      action: "category.create",
      entityType: "category",
      entityId: id,
      description: `Created category "${input.name}" (slug: ${input.slug})`,
      newValues: input,
    });
  }

  return id;
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
  c?: Context<AppEnv>,
) {
  const previous = await categoriesRepo.findBySlug(slug);
  if (!previous) {
    throw notFound("Category");
  }
  const id = previous.id;

  const { brandIds, uploadSessionId, ...rest } = input;

  const coverUrl = await finalizeCover(id, uploadSessionId, userId);
  const patch = coverUrl ? { ...rest, img: coverUrl } : rest;

  if (Object.keys(patch).length > 0) {
    await categoriesRepo.update(id, patch);
  }
  if (brandIds !== undefined) {
    await categoriesRepo.setBrands(id, brandIds);
  }

  if (c) {
    await logActivity({
      c,
      action: "category.update",
      entityType: "category",
      entityId: id,
      description: `Updated category "${previous.name}"`,
      previousValues: previous,
      newValues: input,
    });
  }
}

export async function deleteCategory(slug: string, c?: Context<AppEnv>) {
  const previous = await categoriesRepo.findBySlug(slug);
  if (!previous) {
    throw notFound("Category");
  }

  const inUse = await categoriesRepo.productCountFor(previous.id);
  if (inUse > 0) {
    throw conflict(
      `${inUse} product(s) still use this category. Reassign them first.`,
    );
  }

  await categoriesRepo.remove(previous.id);

  if (c) {
    await logActivity({
      c,
      action: "category.delete",
      entityType: "category",
      entityId: previous.id,
      description: `Deleted category "${previous.name}"`,
      previousValues: previous,
    });
  }
}

export async function reorderCategories(slugs: string[], c?: Context<AppEnv>) {
  const slugToPosition = new Map(slugs.map((slug, index) => [slug, index + 1]));
  await categoriesRepo.reorder(slugToPosition);

  if (c) {
    await logActivity({
      c,
      action: "category.reorder",
      entityType: "category",
      description: "Reordered categories",
      newValues: { slugs },
    });
  }
}
