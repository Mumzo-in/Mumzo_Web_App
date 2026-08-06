import type { VendorContact } from "@mumzo/db/schema/catalog";
import { conflict, notFound } from "@/core/errors";
import * as vendorsRepo from "./vendors.repo";

export async function listVendors(filters: {
  page: number;
  limit: number;
  search?: string;
}) {
  const { rows, total } = await vendorsRepo.findPage(filters);

  return {
    data: rows.map((row) => ({
      ...row,
      type: row.type as
        | "distributor"
        | "retailer"
        | "manufacturer"
        | "company"
        | "other",
      paymentTerms: row.paymentTerms as
        | "net_30"
        | "prepaid"
        | "cod"
        | "net_7"
        | "net_15"
        | "net_60",
    })),
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
  return {
    ...row,
    type: row.type as
      | "distributor"
      | "retailer"
      | "manufacturer"
      | "company"
      | "other",
    paymentTerms: row.paymentTerms as
      | "net_30"
      | "prepaid"
      | "cod"
      | "net_7"
      | "net_15"
      | "net_60",
    productCount,
  };
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
  contacts: VendorContact[];
  address?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  lat?: number | null;
  lng?: number | null;
  gstin?: string | null;
  pan?: string | null;
  paymentTerms: string;
  defaultLeadTimeDays?: number | null;
  notes?: string | null;
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
    contacts: input.contacts,
    address: input.address ?? null,
    city: input.city ?? null,
    state: input.state ?? null,
    pincode: input.pincode ?? null,
    lat: input.lat ?? null,
    lng: input.lng ?? null,
    gstin: input.gstin ?? null,
    pan: input.pan ?? null,
    paymentTerms: input.paymentTerms,
    defaultLeadTimeDays: input.defaultLeadTimeDays ?? null,
    notes: input.notes ?? null,
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

export async function listVendorProducts(
  vendorId: string,
  filters: { page: number; limit: number },
) {
  await requireVendor(vendorId);

  const { rows, total } = await vendorsRepo.findProductsPage(vendorId, filters);

  return {
    data: rows,
    meta: {
      page: filters.page,
      limit: filters.limit,
      total,
      hasNext: filters.page * filters.limit < total,
    },
  };
}
