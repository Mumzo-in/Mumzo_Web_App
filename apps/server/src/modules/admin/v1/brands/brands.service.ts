import { conflict, notFound } from "@/core/errors";
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

export async function createBrand(input: {
  name: string;
  slug: string;
  logoUrl?: string | null;
  isActive: boolean;
}) {
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

  return brandsRepo.insert({
    name: input.name,
    slug: input.slug,
    logoUrl: input.logoUrl ?? null,
    isActive: input.isActive,
  });
}

export async function updateBrand(
  id: string,
  input: Partial<{
    name: string;
    slug: string;
    logoUrl: string | null;
    isActive: boolean;
  }>,
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

  await brandsRepo.update(id, input);
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
