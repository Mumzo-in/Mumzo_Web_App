import { db } from "@mumzo/db";
import { bundle, bundleItem, product } from "@mumzo/db/schema/catalog";
import { and, count, eq, ilike, inArray, or, type SQL } from "drizzle-orm";

/** Pure data access — no business rules. `service.ts` owns those. */

const selection = {
  id: bundle.id,
  slug: bundle.slug,
  name: bundle.name,
  description: bundle.description,
  price: bundle.price,
  images: bundle.images,
  status: bundle.status,
  createdAt: bundle.createdAt,
  updatedAt: bundle.updatedAt,
};

export async function findPage(filters: {
  page: number;
  limit: number;
  search?: string;
  status?: string;
  productId?: string;
}) {
  const conditions: SQL[] = [];

  if (filters.search) {
    const clause = or(
      ilike(bundle.name, `%${filters.search}%`),
      ilike(bundle.slug, `%${filters.search}%`),
    );
    if (clause) {
      conditions.push(clause);
    }
  }
  if (filters.status) {
    conditions.push(eq(bundle.status, filters.status));
  }

  // Product-scoped narrowing reuses the item→bundle join so this behaves
  // like any other filter rather than a separate query path.
  const base = filters.productId
    ? db
        .select(selection)
        .from(bundle)
        .innerJoin(bundleItem, eq(bundleItem.bundleId, bundle.id))
    : db.select(selection).from(bundle);
  const baseCount = filters.productId
    ? db
        .select({ total: count() })
        .from(bundle)
        .innerJoin(bundleItem, eq(bundleItem.bundleId, bundle.id))
    : db.select({ total: count() }).from(bundle);

  if (filters.productId) {
    conditions.push(eq(bundleItem.productId, filters.productId));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [rows, countRows] = await Promise.all([
    base
      .where(where)
      .orderBy(bundle.updatedAt)
      .limit(filters.limit)
      .offset((filters.page - 1) * filters.limit),
    baseCount.where(where),
  ]);

  return { rows, total: countRows[0]?.total ?? 0 };
}

export async function findById(id: string) {
  const [row] = await db
    .select(selection)
    .from(bundle)
    .where(eq(bundle.id, id))
    .limit(1);
  return row;
}

/** Item count per bundle, for the list view — avoids joining the full item+
 * product set just to render a badge. */
export async function itemCountByBundleId(bundleIds: string[]) {
  if (bundleIds.length === 0) {
    return new Map<string, number>();
  }

  const rows = await db
    .select({ bundleId: bundleItem.bundleId, count: count(bundleItem.id) })
    .from(bundleItem)
    .where(inArray(bundleItem.bundleId, bundleIds))
    .groupBy(bundleItem.bundleId);

  return new Map(rows.map((row) => [row.bundleId, row.count]));
}

/** Items for one or more bundles, joined to their product summary — a
 * single query so the service can serialize without N+1 fetches. */
export async function itemsByBundleId(bundleIds: string[]) {
  if (bundleIds.length === 0) {
    return new Map<
      string,
      {
        productId: string;
        productName: string;
        productSlug: string;
        productImage: string | null;
        productPrice: number;
        quantity: number;
      }[]
    >();
  }

  const rows = await db
    .select({
      bundleId: bundleItem.bundleId,
      productId: bundleItem.productId,
      productName: product.name,
      productSlug: product.slug,
      productImages: product.images,
      productPrice: product.price,
      quantity: bundleItem.quantity,
      sortOrder: bundleItem.sortOrder,
    })
    .from(bundleItem)
    .innerJoin(product, eq(product.id, bundleItem.productId))
    .where(inArray(bundleItem.bundleId, bundleIds))
    .orderBy(bundleItem.sortOrder);

  const byBundle = new Map<
    string,
    {
      productId: string;
      productName: string;
      productSlug: string;
      productImage: string | null;
      productPrice: number;
      quantity: number;
    }[]
  >();

  for (const row of rows) {
    const list = byBundle.get(row.bundleId) ?? [];
    list.push({
      productId: row.productId,
      productName: row.productName,
      productSlug: row.productSlug,
      productImage: row.productImages[0] ?? null,
      productPrice: row.productPrice,
      quantity: row.quantity,
    });
    byBundle.set(row.bundleId, list);
  }

  return byBundle;
}

export async function findIdBySlug(slug: string) {
  const [row] = await db
    .select({ id: bundle.id })
    .from(bundle)
    .where(eq(bundle.slug, slug))
    .limit(1);
  return row;
}

export async function productsExist(productIds: string[]) {
  if (productIds.length === 0) {
    return [];
  }
  const rows = await db
    .select({ id: product.id })
    .from(product)
    .where(inArray(product.id, productIds));
  return rows.map((row) => row.id);
}

type BundleRow = typeof bundle.$inferInsert;

export type ItemInput = { productId: string; quantity: number };

/** Fully replaces a bundle's items — the form submits the complete set, same
 * pattern as `products.repo.ts`'s size sync. Called inside the same
 * transaction as the bundle write so the two never disagree. */
async function syncItems(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  bundleId: string,
  items: ItemInput[],
) {
  await tx.delete(bundleItem).where(eq(bundleItem.bundleId, bundleId));

  if (items.length > 0) {
    await tx.insert(bundleItem).values(
      items.map((item, index) => ({
        bundleId,
        productId: item.productId,
        quantity: item.quantity,
        sortOrder: index,
      })),
    );
  }
}

export async function insert(
  values: Omit<BundleRow, "id" | "createdAt" | "updatedAt">,
  items: ItemInput[],
) {
  return db.transaction(async (tx) => {
    const [row] = await tx
      .insert(bundle)
      .values(values)
      .returning({ id: bundle.id });

    if (!row) {
      throw new Error("Insert into bundle returned no row.");
    }

    await syncItems(tx, row.id, items);

    return row.id;
  });
}

export async function update(
  id: string,
  values: Partial<Omit<BundleRow, "id" | "createdAt" | "updatedAt">>,
  items: ItemInput[],
) {
  await db.transaction(async (tx) => {
    if (Object.keys(values).length > 0) {
      await tx.update(bundle).set(values).where(eq(bundle.id, id));
    }

    await syncItems(tx, id, items);
  });
}

export async function remove(id: string) {
  await db.delete(bundle).where(eq(bundle.id, id));
}
