import { db } from "@mumzo/db";
import { hub, inventory } from "@mumzo/db/schema/catalog";
import { count, eq } from "drizzle-orm";

/** Pure data access — no business rules. `service.ts` owns those. */

export async function findAll() {
  return db.select().from(hub).orderBy(hub.name);
}

export async function findById(id: string) {
  const [row] = await db.select().from(hub).where(eq(hub.id, id)).limit(1);
  return row;
}

export async function insert(input: {
  name: string;
  address: string;
  isActive: boolean;
}) {
  const [row] = await db.insert(hub).values(input).returning({ id: hub.id });
  if (!row) {
    throw new Error("Insert into hub returned no row.");
  }
  return row.id;
}

export async function update(
  id: string,
  input: Partial<{ name: string; address: string; isActive: boolean }>,
) {
  await db.update(hub).set(input).where(eq(hub.id, id));
}

export async function remove(id: string) {
  await db.delete(hub).where(eq(hub.id, id));
}

export async function inventoryRowCount(hubId: string) {
  const [row] = await db
    .select({ count: count(inventory.hubId) })
    .from(inventory)
    .where(eq(inventory.hubId, hubId));
  return row?.count ?? 0;
}
