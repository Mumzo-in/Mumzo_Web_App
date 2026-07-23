import { buildKey, toPublicUrl } from "@mumzo/storage";
import { conflict, notFound } from "@/core/errors";
import { finalizeSession } from "../uploads/uploads.service";
import * as brandsRepo from "./brands.repo";

export async function listBrands(search?: string) {
  return brandsRepo.findAll(search);
}

async function requireBrand(id: string) {
  const brand = await brandsRepo.findById(id);
  if (!brand) {
    throw notFound("Brand");
  }
  return brand;
}

/**
 * Copies the draft logo (`mumzo/tmp/{sessionId}/logo.webp`) to its final
 * `mumzo/platform/brands/{brandId}/logo.webp` destination and returns the
 * public URL to store as `logoUrl`. No-op when no session was uploaded.
 */
async function finalizeLogo(
  brandId: string,
  uploadSessionId: string | undefined,
  userId: string,
): Promise<string | undefined> {
  if (!uploadSessionId) {
    return undefined;
  }
  const destKey = buildKey("platform", "brands", brandId, "logo");
  await finalizeSession(uploadSessionId, userId, { logo: destKey });
  return toPublicUrl(destKey);
}

export async function createBrand(
  input: {
    name: string;
    slug: string;
    logoUrl?: string | null;
    isActive: boolean;
    uploadSessionId?: string;
  },
  userId: string,
) {
  const [byName, bySlug] = await Promise.all([
    brandsRepo.findByName(input.name),
    brandsRepo.findBySlug(input.slug),
  ]);

  if (byName) {
    throw conflict(`A brand named "${input.name}" already exists.`);
  }
  if (bySlug) {
    throw conflict(`The slug "${input.slug}" is already in use.`);
  }

  const id = await brandsRepo.insert({
    name: input.name,
    slug: input.slug,
    logoUrl: input.logoUrl ?? null,
    isActive: input.isActive,
  });

  const logoUrl = await finalizeLogo(id, input.uploadSessionId, userId);
  if (logoUrl) {
    await brandsRepo.update(id, { logoUrl });
  }

  return id;
}

export async function updateBrand(
  id: string,
  input: Partial<{
    name: string;
    slug: string;
    logoUrl: string | null;
    isActive: boolean;
    uploadSessionId: string;
  }>,
  userId: string,
) {
  await requireBrand(id);

  if (input.name) {
    const existing = await brandsRepo.findByName(input.name);
    if (existing && existing.id !== id) {
      throw conflict(`A brand named "${input.name}" already exists.`);
    }
  }
  if (input.slug) {
    const existing = await brandsRepo.findBySlug(input.slug);
    if (existing && existing.id !== id) {
      throw conflict(`The slug "${input.slug}" is already in use.`);
    }
  }

  const { uploadSessionId, ...rest } = input;
  const logoUrl = await finalizeLogo(id, uploadSessionId, userId);
  const patch = logoUrl ? { ...rest, logoUrl } : rest;

  if (Object.keys(patch).length > 0) {
    await brandsRepo.update(id, patch);
  }
}

export async function deleteBrand(id: string) {
  await requireBrand(id);

  const inUse = await brandsRepo.productCount(id);
  if (inUse > 0) {
    throw conflict(
      `${inUse} product(s) still use this brand. Reassign them first.`,
    );
  }

  await brandsRepo.remove(id);
}
