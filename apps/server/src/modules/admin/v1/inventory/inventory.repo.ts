import { db } from "@mumzo/db";
import { hub, inventory, product } from "@mumzo/db/schema/catalog";
import { and, eq, ilike, lte, or, type SQL } from "drizzle-orm";

/** Pure data access — no business rules. `service.ts` owns those. */

export async function findAll(filters: {
  hubId?: string;
  search?: string;
  lowStockOnly?: boolean;
}) {
  const conditions: SQL[] = [
    filters.hubId ? eq(inventory.hubId, filters.hubId) : undefined,
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
      hubId: inventory.hubId,
      hubName: hub.name,
      productId: inventory.productId,
      productName: product.name,
      sku: product.sku,
      stock: inventory.stock,
      reorderPoint: inventory.reorderPoint,
      updatedAt: inventory.updatedAt,
    })
    .from(inventory)
    .innerJoin(hub, eq(hub.id, inventory.hubId))
    .innerJoin(product, eq(product.id, inventory.productId))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(product.name);
}

export async function upsert(input: {
  hubId: string;
  productId: string;
  stock: number;
  reorderPoint?: number;
}) {
  await db
    .insert(inventory)
    .values({
      hubId: input.hubId,
      productId: input.productId,
      stock: input.stock,
      ...(input.reorderPoint !== undefined
        ? { reorderPoint: input.reorderPoint }
        : {}),
    })
    .onConflictDoUpdate({
      target: [inventory.hubId, inventory.productId],
      set: {
        stock: input.stock,
        ...(input.reorderPoint !== undefined
          ? { reorderPoint: input.reorderPoint }
          : {}),
        updatedAt: new Date(),
      },
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
