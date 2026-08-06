import { db } from "@mumzo/db";
import {
  brand,
  category,
  categoryBrand,
  product,
} from "@mumzo/db/schema/catalog";
import { count, desc, eq, ilike, inArray, or } from "drizzle-orm";

/** Pure data access — no business rules. `service.ts` owns those. */

async function categorySlugsByBrandId(brandIds: string[]) {
  if (brandIds.length === 0) {
    return new Map<string, string[]>();
  }

  const rows = await db
    .select({
      brandId: categoryBrand.brandId,
      categorySlug: category.slug,
    })
    .from(categoryBrand)
    .innerJoin(category, eq(category.id, categoryBrand.categoryId))
    .where(inArray(categoryBrand.brandId, brandIds));

  const byBrand = new Map<string, string[]>();
  for (const row of rows) {
    const list = byBrand.get(row.brandId) ?? [];
    list.push(row.categorySlug);
    byBrand.set(row.brandId, list);
  }
  return byBrand;
}

export async function findPage(filters: {
  page: number;
  limit: number;
  search?: string;
}) {
  const where = filters.search
    ? or(
        ilike(brand.name, `%${filters.search}%`),
        ilike(brand.slug, `%${filters.search}%`),
      )
    : undefined;

  const [rows, [{ total = 0 } = {}]] = await Promise.all([
    db
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
      .where(where)
      .groupBy(brand.id)
      .orderBy(desc(brand.createdAt))
      .limit(filters.limit)
      .offset((filters.page - 1) * filters.limit),
    db.select({ total: count() }).from(brand).where(where),
  ]);

  const categorySlugs = await categorySlugsByBrandId(rows.map((row) => row.id));

  return {
    rows: rows.map((row) => ({
      ...row,
      categorySlugs: categorySlugs.get(row.id) ?? [],
    })),
    total,
  };
}

export async function findAll() {
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
    .groupBy(brand.id)
    .orderBy(desc(brand.createdAt));

  return rows;
}

export async function findById(id: string) {
  const [row] = await db.select().from(brand).where(eq(brand.id, id)).limit(1);
  if (!row) {
    return undefined;
  }

  const [{ count: productCount = 0 } = {}] = await db
    .select({ count: count(product.id) })
    .from(product)
    .where(eq(product.brandId, row.id));

  const categorySlugs = await categorySlugsByBrandId([row.id]);

  return {
    ...row,
    categorySlugs: categorySlugs.get(row.id) ?? [],
    productCount,
  };
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

export async function setCategories(brandId: string, categorySlugs: string[]) {
  await db.transaction(async (tx) => {
    await tx.delete(categoryBrand).where(eq(categoryBrand.brandId, brandId));
    if (categorySlugs.length === 0) {
      return;
    }
    const rows = await tx
      .select({ id: category.id })
      .from(category)
      .where(inArray(category.slug, categorySlugs));
    if (rows.length > 0) {
      await tx
        .insert(categoryBrand)
        .values(rows.map((row) => ({ categoryId: row.id, brandId })));
    }
  });
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
