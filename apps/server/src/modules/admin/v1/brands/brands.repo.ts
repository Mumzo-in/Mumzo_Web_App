import { db } from "@mumzo/db";
import { brand, product } from "@mumzo/db/schema/catalog";
import { count, eq, ilike, or } from "drizzle-orm";

/** Pure data access — no business rules. `service.ts` owns those. */

export async function findAll(search?: string) {
  const rows = await db
    .select({
      id: brand.id,
      name: brand.name,
      slug: brand.slug,
      logoUrl: brand.logoUrl,
      isActive: brand.isActive,
      productCount: count(product.id),
    })
    .from(brand)
    .leftJoin(product, eq(product.brandId, brand.id))
    .where(
      search
        ? or(ilike(brand.name, `%${search}%`), ilike(brand.slug, `%${search}%`))
        : undefined,
    )
    .groupBy(brand.id)
    .orderBy(brand.name);

  return rows;
}

export async function findById(id: string) {
  const [row] = await db.select().from(brand).where(eq(brand.id, id)).limit(1);
  return row;
}

export async function findByName(name: string) {
  const [row] = await db
    .select({ id: brand.id })
    .from(brand)
    .where(eq(brand.name, name))
    .limit(1);
  return row;
}

export async function findBySlug(slug: string) {
  const [row] = await db
    .select({ id: brand.id })
    .from(brand)
    .where(eq(brand.slug, slug))
    .limit(1);
  return row;
}

export async function insert(input: {
  name: string;
  slug: string;
  logoUrl: string | null;
  isActive: boolean;
}) {
  const [row] = await db
    .insert(brand)
    .values(input)
    .returning({ id: brand.id });
  if (!row) {
    throw new Error("Insert into brand returned no row.");
  }
  return row.id;
}

export async function update(
  id: string,
  input: Partial<{
    name: string;
    slug: string;
    logoUrl: string | null;
    isActive: boolean;
  }>,
) {
  await db.update(brand).set(input).where(eq(brand.id, id));
}

export async function remove(id: string) {
  await db.delete(brand).where(eq(brand.id, id));
}

export async function productCount(brandId: string) {
  const [row] = await db
    .select({ count: count(product.id) })
    .from(product)
    .where(eq(product.brandId, brandId));
  return row?.count ?? 0;
}
