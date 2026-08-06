import { db } from "@mumzo/db";
import type { VendorContact } from "@mumzo/db/schema/catalog";
import {
  category,
  inventory,
  product,
  productVendor,
  vendor,
} from "@mumzo/db/schema/catalog";
import { count, eq, ilike, or, sum } from "drizzle-orm";

/** Pure data access — no business rules. `service.ts` owns those. */

const selection = {
  id: vendor.id,
  name: vendor.name,
  slug: vendor.slug,
  type: vendor.type,
  contacts: vendor.contacts,
  address: vendor.address,
  city: vendor.city,
  state: vendor.state,
  pincode: vendor.pincode,
  lat: vendor.lat,
  lng: vendor.lng,
  gstin: vendor.gstin,
  pan: vendor.pan,
  paymentTerms: vendor.paymentTerms,
  defaultLeadTimeDays: vendor.defaultLeadTimeDays,
  notes: vendor.notes,
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

export type VendorWriteInput = {
  name: string;
  slug: string;
  type: string;
  contacts: VendorContact[];
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  lat: number | null;
  lng: number | null;
  gstin: string | null;
  pan: string | null;
  paymentTerms: string;
  defaultLeadTimeDays: number | null;
  notes: string | null;
  isActive: boolean;
};

export async function insert(input: VendorWriteInput) {
  const [row] = await db
    .insert(vendor)
    .values(input)
    .returning({ id: vendor.id });
  if (!row) {
    throw new Error("Insert into vendor returned no row.");
  }
  return row.id;
}

export async function update(id: string, input: Partial<VendorWriteInput>) {
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

export async function findProductsPage(
  vendorId: string,
  filters: { page: number; limit: number },
) {
  const [rows, countRows] = await Promise.all([
    db
      .select({
        id: product.id,
        name: product.name,
        slug: product.slug,
        categorySlug: category.slug,
        price: product.price,
        status: product.status,
        stock: sum(inventory.stock),
        costPrice: productVendor.costPrice,
        leadTimeDays: productVendor.leadTimeDays,
        isPrimary: productVendor.isPrimary,
        vendorSku: productVendor.vendorSku,
        moq: productVendor.moq,
      })
      .from(productVendor)
      .innerJoin(product, eq(product.id, productVendor.productId))
      .innerJoin(category, eq(category.id, product.categoryId))
      .leftJoin(inventory, eq(inventory.productId, product.id))
      .where(eq(productVendor.vendorId, vendorId))
      .groupBy(
        product.id,
        category.slug,
        productVendor.costPrice,
        productVendor.leadTimeDays,
        productVendor.isPrimary,
        productVendor.vendorSku,
        productVendor.moq,
      )
      .orderBy(product.name)
      .limit(filters.limit)
      .offset((filters.page - 1) * filters.limit),
    db
      .select({ total: count() })
      .from(productVendor)
      .where(eq(productVendor.vendorId, vendorId)),
  ]);

  return {
    rows: rows.map((row) => ({
      ...row,
      stock: Number(row.stock ?? 0),
    })),
    total: countRows[0]?.total ?? 0,
  };
}
