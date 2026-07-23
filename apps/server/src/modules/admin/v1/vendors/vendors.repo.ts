import { db } from "@mumzo/db";
import { productVendor, vendor } from "@mumzo/db/schema/catalog";
import { count, eq, ilike, or } from "drizzle-orm";

/** Pure data access — no business rules. `service.ts` owns those. */

const selection = {
  id: vendor.id,
  name: vendor.name,
  slug: vendor.slug,
  contactName: vendor.contactName,
  phone: vendor.phone,
  email: vendor.email,
  address: vendor.address,
  gstin: vendor.gstin,
  isActive: vendor.isActive,
  productCount: count(productVendor.productId),
};

function baseQuery() {
  return db
    .select(selection)
    .from(vendor)
    .leftJoin(productVendor, eq(productVendor.vendorId, vendor.id));
}

export async function findPage(filters: {
  page: number;
  limit: number;
  search?: string;
}) {
  const where = filters.search
    ? or(
        ilike(vendor.name, `%${filters.search}%`),
        ilike(vendor.slug, `%${filters.search}%`),
      )
    : undefined;

  const [rows, countRows] = await Promise.all([
    baseQuery()
      .where(where)
      .groupBy(vendor.id)
      .orderBy(vendor.name)
      .limit(filters.limit)
      .offset((filters.page - 1) * filters.limit),
    db.select({ total: count() }).from(vendor).where(where),
  ]);

  return { rows, total: countRows[0]?.total ?? 0 };
}

export async function findById(id: string) {
  const [row] = await db
    .select()
    .from(vendor)
    .where(eq(vendor.id, id))
    .limit(1);
  return row;
}

export async function findByName(name: string) {
  const [row] = await db
    .select({ id: vendor.id })
    .from(vendor)
    .where(eq(vendor.name, name))
    .limit(1);
  return row;
}

export async function findBySlug(slug: string) {
  const [row] = await db
    .select({ id: vendor.id })
    .from(vendor)
    .where(eq(vendor.slug, slug))
    .limit(1);
  return row;
}

export async function insert(input: {
  name: string;
  slug: string;
  contactName: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  gstin: string | null;
  isActive: boolean;
}) {
  const [row] = await db
    .insert(vendor)
    .values(input)
    .returning({ id: vendor.id });
  if (!row) {
    throw new Error("Insert into vendor returned no row.");
  }
  return row.id;
}

export async function update(
  id: string,
  input: Partial<{
    name: string;
    slug: string;
    contactName: string | null;
    phone: string | null;
    email: string | null;
    address: string | null;
    gstin: string | null;
    isActive: boolean;
  }>,
) {
  await db.update(vendor).set(input).where(eq(vendor.id, id));
}

export async function remove(id: string) {
  await db.delete(vendor).where(eq(vendor.id, id));
}

export async function productCount(vendorId: string) {
  const [row] = await db
    .select({ count: count(productVendor.productId) })
    .from(productVendor)
    .where(eq(productVendor.vendorId, vendorId));
  return row?.count ?? 0;
}
