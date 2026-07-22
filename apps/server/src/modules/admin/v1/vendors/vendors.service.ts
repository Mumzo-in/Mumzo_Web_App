import { conflict, notFound } from "@/core/errors";
import * as vendorsRepo from "./vendors.repo";

type VendorType = "retailer" | "store" | "distributor";

function serialize<T extends { type: string }>(row: T) {
  return { ...row, type: row.type as VendorType };
}

export async function listVendors(filters: {
  page: number;
  limit: number;
  search?: string;
}) {
  const { rows, total } = await vendorsRepo.findPage(filters);

  return {
    data: rows.map(serialize),
    meta: {
      page: filters.page,
      limit: filters.limit,
      total,
      hasNext: filters.page * filters.limit < total,
    },
  };
}

export async function getVendor(id: string) {
  const row = await requireVendor(id);
  const productCount = await vendorsRepo.productCount(id);
  return serialize({ ...row, productCount });
}

async function requireVendor(id: string) {
  const vendor = await vendorsRepo.findById(id);
  if (!vendor) {
    throw notFound("Vendor");
  }
  return vendor;
}

type VendorInput = {
  name: string;
  slug: string;
  type: string;
  contactName?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  gstin?: string | null;
  isActive: boolean;
};

export async function createVendor(input: VendorInput) {
  const [byName, bySlug] = await Promise.all([
    vendorsRepo.findByName(input.name),
    vendorsRepo.findBySlug(input.slug),
  ]);

  if (byName) {
    throw conflict(`A vendor named "${input.name}" already exists.`);
  }
  if (bySlug) {
    throw conflict(`The slug "${input.slug}" is already in use.`);
  }

  return vendorsRepo.insert({
    name: input.name,
    slug: input.slug,
    type: input.type,
    contactName: input.contactName ?? null,
    phone: input.phone ?? null,
    email: input.email ?? null,
    address: input.address ?? null,
    gstin: input.gstin ?? null,
    isActive: input.isActive,
  });
}

export async function updateVendor(id: string, input: Partial<VendorInput>) {
  await requireVendor(id);

  if (input.name) {
    const existing = await vendorsRepo.findByName(input.name);
    if (existing && existing.id !== id) {
      throw conflict(`A vendor named "${input.name}" already exists.`);
    }
  }
  if (input.slug) {
    const existing = await vendorsRepo.findBySlug(input.slug);
    if (existing && existing.id !== id) {
      throw conflict(`The slug "${input.slug}" is already in use.`);
    }
  }

  await vendorsRepo.update(id, input);
}

export async function deleteVendor(id: string) {
  await requireVendor(id);

  const inUse = await vendorsRepo.productCount(id);
  if (inUse > 0) {
    throw conflict(
      `${inUse} product(s) still use this vendor. Reassign them first.`,
    );
  }

  await vendorsRepo.remove(id);
}
