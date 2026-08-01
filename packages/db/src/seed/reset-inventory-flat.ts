/**
 * One-off normalizer: sets every (hub × product × variant) inventory row to
 * exactly `FLAT_STOCK` units, inserting any missing combination and updating
 * every existing row — unlike `seedInventory()` (randomized, insert-only),
 * this always overwrites so every product is uniformly in stock everywhere.
 *
 * Run with: bun run src/seed/reset-inventory-flat.ts (from packages/db)
 */
import { eq } from "drizzle-orm";
import { db } from "../index";
import {
  hub,
  inventory,
  product,
  productColor,
  productSize,
} from "../schema/catalog";

const FLAT_STOCK = 20;

async function resetInventoryFlat() {
  const [hubs, products, sizes, colors, existing] = await Promise.all([
    db.select({ id: hub.id }).from(hub).where(eq(hub.isActive, true)),
    db.select({ id: product.id }).from(product),
    db
      .select({ id: productSize.id, productId: productSize.productId })
      .from(productSize),
    db
      .select({ id: productColor.id, productId: productColor.productId })
      .from(productColor),
    db
      .select({
        id: inventory.id,
        hubId: inventory.hubId,
        productId: inventory.productId,
        productSizeId: inventory.productSizeId,
        productColorId: inventory.productColorId,
      })
      .from(inventory),
  ]);

  const sizesByProduct = new Map<string, string[]>();
  for (const s of sizes) {
    const list = sizesByProduct.get(s.productId) ?? [];
    list.push(s.id);
    sizesByProduct.set(s.productId, list);
  }
  const colorsByProduct = new Map<string, string[]>();
  for (const c of colors) {
    const list = colorsByProduct.get(c.productId) ?? [];
    list.push(c.id);
    colorsByProduct.set(c.productId, list);
  }

  const existingByKey = new Map(
    existing.map((row) => [
      `${row.hubId}:${row.productId}:${row.productSizeId}:${row.productColorId}`,
      row.id,
    ]),
  );

  const toInsert: (typeof inventory.$inferInsert)[] = [];
  let updated = 0;

  for (const p of products) {
    const productSizeIds = sizesByProduct.get(p.id) ?? [];
    const productColorIds = colorsByProduct.get(p.id) ?? [];
    const variants: { sizeId: string | null; colorId: string | null }[] =
      productSizeIds.length > 0
        ? productSizeIds.map((id) => ({ sizeId: id, colorId: null }))
        : productColorIds.length > 0
          ? productColorIds.map((id) => ({ sizeId: null, colorId: id }))
          : [{ sizeId: null, colorId: null }];

    for (const h of hubs) {
      for (const variant of variants) {
        const key = `${h.id}:${p.id}:${variant.sizeId}:${variant.colorId}`;
        const existingId = existingByKey.get(key);
        if (existingId) {
          await db
            .update(inventory)
            .set({ stock: FLAT_STOCK })
            .where(eq(inventory.id, existingId));
          updated++;
        } else {
          toInsert.push({
            hubId: h.id,
            productId: p.id,
            productSizeId: variant.sizeId,
            productColorId: variant.colorId,
            stock: FLAT_STOCK,
          });
        }
      }
    }
  }

  const BATCH_SIZE = 500;
  for (let i = 0; i < toInsert.length; i += BATCH_SIZE) {
    await db.insert(inventory).values(toInsert.slice(i, i + BATCH_SIZE));
  }

  console.log(
    `Inventory reset to ${FLAT_STOCK} units: ${updated} rows updated, ${toInsert.length} rows inserted.`,
  );
}

resetInventoryFlat()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
