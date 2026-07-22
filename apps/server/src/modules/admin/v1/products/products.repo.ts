import { db } from "@mumzo/db";
import {
  brand,
  category,
  product,
  productSize,
  vendor,
} from "@mumzo/db/schema/catalog";
import { and, count, eq, ilike, inArray, or, type SQL } from "drizzle-orm";

/** Pure data access — no business rules. `service.ts` owns those. */

const selection = {
  id: product.id,
  slug: product.slug,
  sku: product.sku,
  name: product.name,
  brandId: product.brandId,
  brandName: brand.name,
  vendorId: product.vendorId,
  vendorName: vendor.name,
  categoryId: product.categoryId,
  categorySlug: category.slug,
  price: product.price,
  mrp: product.mrp,
  costPrice: product.costPrice,
  qty: product.qty,
  weight: product.weight,
  description: product.description,
  about: product.about,
  highlights: product.highlights,
  countryOfOrigin: product.countryOfOrigin,
  images: product.images,
  ages: product.ages,
  type: product.type,
  tags: product.tags,
  isBestseller: product.isBestseller,
  status: product.status,
  rating: product.rating,
  createdAt: product.createdAt,
  updatedAt: product.updatedAt,
};

function baseQuery() {
  return db
    .select(selection)
    .from(product)
    .innerJoin(brand, eq(brand.id, product.brandId))
    .innerJoin(category, eq(category.id, product.categoryId))
    .leftJoin(vendor, eq(vendor.id, product.vendorId));
}

export async function findPage(filters: {
  page: number;
  limit: number;
  search?: string;
  status?: string;
  categorySlug?: string;
  vendorId?: string;
}) {
  const conditions: SQL[] = [];

  if (filters.search) {
    const clause = or(
      ilike(product.name, `%${filters.search}%`),
      ilike(product.sku, `%${filters.search}%`),
      ilike(brand.name, `%${filters.search}%`),
    );
    if (clause) {
      conditions.push(clause);
    }
  }
  if (filters.status) {
    conditions.push(eq(product.status, filters.status));
  }
  if (filters.categorySlug) {
    conditions.push(eq(category.slug, filters.categorySlug));
  }
  if (filters.vendorId) {
    conditions.push(eq(product.vendorId, filters.vendorId));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [rows, countRows] = await Promise.all([
    baseQuery()
      .where(where)
      .orderBy(product.updatedAt)
      .limit(filters.limit)
      .offset((filters.page - 1) * filters.limit),
    db
      .select({ total: count(product.id) })
      .from(product)
      .innerJoin(brand, eq(brand.id, product.brandId))
      .innerJoin(category, eq(category.id, product.categoryId))
      .where(where),
  ]);

  return { rows, total: countRows[0]?.total ?? 0 };
}

export async function findById(id: string) {
  const [row] = await baseQuery().where(eq(product.id, id)).limit(1);
  return row;
}

export async function sizesByProductId(productIds: string[]) {
  if (productIds.length === 0) {
    return new Map<string, { label: string; price: number; stock: number }[]>();
  }

  const rows = await db
    .select({
      productId: productSize.productId,
      label: productSize.label,
      price: productSize.price,
      stock: productSize.stock,
    })
    .from(productSize)
    .where(inArray(productSize.productId, productIds))
    .orderBy(productSize.position);

  const byProduct = new Map<
    string,
    { label: string; price: number; stock: number }[]
  >();

  for (const row of rows) {
    const list = byProduct.get(row.productId) ?? [];
    list.push({ label: row.label, price: row.price, stock: row.stock });
    byProduct.set(row.productId, list);
  }

  return byProduct;
}

export async function findIdBySlug(slug: string) {
  const [row] = await db
    .select({ id: product.id })
    .from(product)
    .where(eq(product.slug, slug))
    .limit(1);
  return row;
}

export async function findIdBySku(sku: string) {
  const [row] = await db
    .select({ id: product.id })
    .from(product)
    .where(eq(product.sku, sku))
    .limit(1);
  return row;
}

export async function findCategoryIdBySlug(slug: string) {
  const [row] = await db
    .select({ id: category.id })
    .from(category)
    .where(eq(category.slug, slug))
    .limit(1);
  return row;
}

export async function brandExists(brandId: string) {
  const [row] = await db
    .select({ id: brand.id })
    .from(brand)
    .where(eq(brand.id, brandId))
    .limit(1);
  return Boolean(row);
}

export async function vendorExists(vendorId: string) {
  const [row] = await db
    .select({ id: vendor.id })
    .from(vendor)
    .where(eq(vendor.id, vendorId))
    .limit(1);
  return Boolean(row);
}

type ProductRow = typeof product.$inferInsert;

export async function insert(
  values: Omit<ProductRow, "id" | "createdAt" | "updatedAt">,
  sizes: { label: string; price: number; stock: number }[],
) {
  return db.transaction(async (tx) => {
    const [row] = await tx
      .insert(product)
      .values(values)
      .returning({ id: product.id });

    if (!row) {
      throw new Error("Insert into product returned no row.");
    }

    if (sizes.length > 0) {
      await tx.insert(productSize).values(
        sizes.map((size, index) => ({
          productId: row.id,
          label: size.label,
          price: size.price,
          stock: size.stock,
          position: index,
        })),
      );
    }

    return row.id;
  });
}

export async function update(
  id: string,
  values: Partial<Omit<ProductRow, "id" | "createdAt" | "updatedAt">>,
  sizes: { label: string; price: number; stock: number }[],
) {
  await db.transaction(async (tx) => {
    if (Object.keys(values).length > 0) {
      await tx.update(product).set(values).where(eq(product.id, id));
    }

    // Sizes are always fully replaced — the form submits the complete set.
    await tx.delete(productSize).where(eq(productSize.productId, id));

    if (sizes.length > 0) {
      await tx.insert(productSize).values(
        sizes.map((size, index) => ({
          productId: id,
          label: size.label,
          price: size.price,
          stock: size.stock,
          position: index,
        })),
      );
    }
  });
}

export async function remove(id: string) {
  await db.delete(product).where(eq(product.id, id));
}
