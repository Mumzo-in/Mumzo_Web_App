import { db } from "@mumzo/db";
import {
  hub,
  inventory,
  product,
  productColor,
  productSize,
} from "@mumzo/db/schema/catalog";
import { and, eq, ilike, isNull, lte, or, type SQL, sql } from "drizzle-orm";

/** Pure data access — no business rules. `service.ts` owns those. */

export async function findAll(filters: {
  hubId?: string;
  productId?: string;
  search?: string;
  lowStockOnly?: boolean;
}) {
  // Orphaned inventory rows (their size/color variant was since deleted) are
  // real garbage — safe to sweep. The broader "does productSizeId=null even
  // belong here" self-heal that used to run alongside this was removed: it
  // guessed at intent from a label string and could delete real per-hub
  // stock. The actual duplicate-row bug was the admin form resolving a
  // variant's id from live (possibly stale) form state instead of the saved
  // product — fixed at the source in `product-form.tsx`.
  await db.execute(sql`
    DELETE FROM inventory
    WHERE product_size_id IS NOT NULL
      AND product_size_id NOT IN (SELECT id FROM product_size)
  `);
  await db.execute(sql`
    DELETE FROM inventory
    WHERE product_color_id IS NOT NULL
      AND product_color_id NOT IN (SELECT id FROM product_color)
  `);

  const conditions: SQL[] = [
    filters.hubId ? eq(inventory.hubId, filters.hubId) : undefined,
    filters.productId ? eq(inventory.productId, filters.productId) : undefined,
    filters.search
      ? or(
          ilike(product.name, `%${filters.search}%`),
          ilike(product.sku, `%${filters.search}%`),
        )
      : undefined,
    filters.lowStockOnly
      ? lte(inventory.stock, inventory.reorderPoint)
      : undefined,
  ].filter((c): c is SQL => c !== undefined);

  return db
    .select({
      id: inventory.id,
      hubId: inventory.hubId,
      hubName: hub.name,
      productId: inventory.productId,
      productName: product.name,
      sku: product.sku,
      productSizeId: inventory.productSizeId,
      sizeLabel: productSize.label,
      productColorId: inventory.productColorId,
      colorLabel: productColor.label,
      stock: inventory.stock,
      reorderPoint: inventory.reorderPoint,
      updatedAt: inventory.updatedAt,
    })
    .from(inventory)
    .innerJoin(hub, eq(hub.id, inventory.hubId))
    .innerJoin(product, eq(product.id, inventory.productId))
    .leftJoin(productSize, eq(productSize.id, inventory.productSizeId))
    .leftJoin(productColor, eq(productColor.id, inventory.productColorId))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(product.name);
}

/** A product's variants (or `[null]` for a product with none) — used to seed
 * an inventory row per variant when a hub carries the product for the first
 * time. */
export async function productVariants(productId: string) {
  const [sizes, colors] = await Promise.all([
    db
      .select({ id: productSize.id, label: productSize.label })
      .from(productSize)
      .where(eq(productSize.productId, productId)),
    db
      .select({ id: productColor.id, label: productColor.label })
      .from(productColor)
      .where(eq(productColor.productId, productId)),
  ]);
  return { sizes, colors };
}

function variantCondition(
  productSizeId: string | null,
  productColorId: string | null,
) {
  return productSizeId
    ? eq(inventory.productSizeId, productSizeId)
    : productColorId
      ? eq(inventory.productColorId, productColorId)
      : and(isNull(inventory.productSizeId), isNull(inventory.productColorId));
}

export async function upsert(input: {
  hubId: string;
  productId: string;
  productSizeId?: string | null;
  productColorId?: string | null;
  stock: number;
  reorderPoint?: number;
}) {
  const productSizeId = input.productSizeId ?? null;
  const productColorId = input.productColorId ?? null;

  const [existing] = await db
    .select({ id: inventory.id })
    .from(inventory)
    .where(
      and(
        eq(inventory.hubId, input.hubId),
        eq(inventory.productId, input.productId),
        variantCondition(productSizeId, productColorId),
      ),
    )
    .limit(1);

  if (existing) {
    await db
      .update(inventory)
      .set({
        stock: input.stock,
        ...(input.reorderPoint !== undefined
          ? { reorderPoint: input.reorderPoint }
          : {}),
        updatedAt: new Date(),
      })
      .where(eq(inventory.id, existing.id));
    return;
  }

  await db.insert(inventory).values({
    hubId: input.hubId,
    productId: input.productId,
    productSizeId,
    productColorId,
    stock: input.stock,
    ...(input.reorderPoint !== undefined
      ? { reorderPoint: input.reorderPoint }
      : {}),
  });
}

export async function hubExists(hubId: string) {
  const [row] = await db
    .select({ id: hub.id })
    .from(hub)
    .where(eq(hub.id, hubId))
    .limit(1);
  return Boolean(row);
}

export async function productExists(productId: string) {
  const [row] = await db
    .select({ id: product.id })
    .from(product)
    .where(eq(product.id, productId))
    .limit(1);
  return Boolean(row);
}

export async function variantBelongsToProduct(
  productId: string,
  productSizeId: string | null,
  productColorId: string | null,
) {
  if (productSizeId) {
    const [row] = await db
      .select({ id: productSize.id })
      .from(productSize)
      .where(
        and(
          eq(productSize.id, productSizeId),
          eq(productSize.productId, productId),
        ),
      )
      .limit(1);
    return Boolean(row);
  }
  if (productColorId) {
    const [row] = await db
      .select({ id: productColor.id })
      .from(productColor)
      .where(
        and(
          eq(productColor.id, productColorId),
          eq(productColor.productId, productId),
        ),
      )
      .limit(1);
    return Boolean(row);
  }
  return true;
}
