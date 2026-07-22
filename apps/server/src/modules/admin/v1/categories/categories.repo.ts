import { db } from "@mumzo/db";
import {
  brand,
  category,
  categoryBrand,
  product,
} from "@mumzo/db/schema/catalog";
import { count, eq, inArray, sql } from "drizzle-orm";

/** Pure data access — no business rules. `service.ts` owns those. */

async function brandsByCategoryId(categoryIds: string[]) {
  if (categoryIds.length === 0) {
    return new Map<string, string[]>();
  }

  const rows = await db
    .select({
      categoryId: categoryBrand.categoryId,
      brandName: brand.name,
    })
    .from(categoryBrand)
    .innerJoin(brand, eq(brand.id, categoryBrand.brandId))
    .where(inArray(categoryBrand.categoryId, categoryIds));

  const byCategory = new Map<string, string[]>();
  for (const row of rows) {
    const list = byCategory.get(row.categoryId) ?? [];
    list.push(row.brandName);
    byCategory.set(row.categoryId, list);
  }
  return byCategory;
}

async function productCounts() {
  const rows = await db
    .select({ categoryId: product.categoryId, count: count(product.id) })
    .from(product)
    .groupBy(product.categoryId);

  return new Map(rows.map((row) => [row.categoryId, row.count]));
}

export async function findAll() {
  const rows = await db.select().from(category).orderBy(category.position);
  const [brandsByCategory, counts] = await Promise.all([
    brandsByCategoryId(rows.map((row) => row.id)),
    productCounts(),
  ]);

  return rows.map((row) => ({
    ...row,
    brands: brandsByCategory.get(row.id) ?? [],
    productCount: counts.get(row.id) ?? 0,
  }));
}

export async function findBySlug(slug: string) {
  const [row] = await db
    .select()
    .from(category)
    .where(eq(category.slug, slug))
    .limit(1);

  if (!row) {
    return undefined;
  }

  const brandsByCategory = await brandsByCategoryId([row.id]);
  const [{ count: productCount = 0 } = {}] = await db
    .select({ count: count(product.id) })
    .from(product)
    .where(eq(product.categoryId, row.id));

  return {
    ...row,
    brands: brandsByCategory.get(row.id) ?? [],
    productCount,
  };
}

export async function findIdBySlug(slug: string) {
  const [row] = await db
    .select({ id: category.id })
    .from(category)
    .where(eq(category.slug, slug))
    .limit(1);
  return row;
}

export async function maxPosition() {
  const [row] = await db
    .select({ max: sql<number>`coalesce(max(${category.position}), 0)::int` })
    .from(category);
  return row?.max ?? 0;
}

export async function insert(input: {
  slug: string;
  name: string;
  tagline: string | null;
  img: string | null;
  color: string | null;
  isActive: boolean;
  hasSizes: boolean;
  position: number;
}) {
  const [row] = await db
    .insert(category)
    .values(input)
    .returning({ id: category.id });
  if (!row) {
    throw new Error("Insert into category returned no row.");
  }
  return row.id;
}

export async function update(
  id: string,
  input: Partial<{
    name: string;
    tagline: string | null;
    img: string | null;
    color: string | null;
    isActive: boolean;
    hasSizes: boolean;
  }>,
) {
  await db.update(category).set(input).where(eq(category.id, id));
}

export async function setBrands(categoryId: string, brandIds: string[]) {
  await db.transaction(async (tx) => {
    await tx
      .delete(categoryBrand)
      .where(eq(categoryBrand.categoryId, categoryId));
    if (brandIds.length > 0) {
      await tx
        .insert(categoryBrand)
        .values(brandIds.map((brandId) => ({ categoryId, brandId })));
    }
  });
}

export async function remove(id: string) {
  await db.delete(category).where(eq(category.id, id));
}

export async function productCountFor(categoryId: string) {
  const [row] = await db
    .select({ count: count(product.id) })
    .from(product)
    .where(eq(product.categoryId, categoryId));
  return row?.count ?? 0;
}

export async function reorder(slugToPosition: Map<string, number>) {
  await db.transaction(async (tx) => {
    for (const [slug, position] of slugToPosition) {
      await tx
        .update(category)
        .set({ position })
        .where(eq(category.slug, slug));
    }
  });
}
