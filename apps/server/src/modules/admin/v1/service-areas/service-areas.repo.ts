import { db } from "@mumzo/db";
import { hub, serviceArea } from "@mumzo/db/schema/catalog";
import { eq } from "drizzle-orm";

/** Pure data access — no business rules. `service.ts` owns those. */

const selection = {
  id: serviceArea.id,
  name: serviceArea.name,
  pincode: serviceArea.pincode,
  hubId: serviceArea.hubId,
  hubName: hub.name,
  isActive: serviceArea.isActive,
};

function baseQuery() {
  return db
    .select(selection)
    .from(serviceArea)
    .innerJoin(hub, eq(hub.id, serviceArea.hubId));
}

export async function findAll() {
  return baseQuery().orderBy(serviceArea.pincode);
}

export async function findById(id: string) {
  const [row] = await baseQuery().where(eq(serviceArea.id, id)).limit(1);
  return row;
}

export async function findByPincode(pincode: string) {
  const [row] = await db
    .select({ id: serviceArea.id })
    .from(serviceArea)
    .where(eq(serviceArea.pincode, pincode))
    .limit(1);
  return row;
}

export async function hubExists(hubId: string) {
  const [row] = await db
    .select({ id: hub.id })
    .from(hub)
    .where(eq(hub.id, hubId))
    .limit(1);
  return Boolean(row);
}

export async function insert(input: {
  name: string;
  pincode: string;
  hubId: string;
  isActive: boolean;
}) {
  const [row] = await db
    .insert(serviceArea)
    .values(input)
    .returning({ id: serviceArea.id });
  if (!row) {
    throw new Error("Insert into service_area returned no row.");
  }
  return row.id;
}

export async function update(
  id: string,
  input: Partial<{
    name: string;
    pincode: string;
    hubId: string;
    isActive: boolean;
  }>,
) {
  await db.update(serviceArea).set(input).where(eq(serviceArea.id, id));
}

export async function remove(id: string) {
  await db.delete(serviceArea).where(eq(serviceArea.id, id));
}
