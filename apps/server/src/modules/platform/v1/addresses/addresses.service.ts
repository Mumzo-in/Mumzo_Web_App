import { db } from "@mumzo/db";
import { address } from "@mumzo/db/schema/account";
import { and, eq } from "drizzle-orm";

import { notFound } from "@/core/errors";

export type AddressLabel = "Home" | "Work" | "Other";

export interface AddressInput {
  label: AddressLabel;
  name: string;
  phone: string;
  line1: string;
  line2: string;
  landmark?: string;
  pincode: string;
  city: string;
  lat?: number;
  lng?: number;
  isDefault: boolean;
}

function toPublicAddress(row: typeof address.$inferSelect) {
  return {
    id: row.id,
    label: row.label as AddressLabel,
    name: row.name,
    phone: row.phone,
    line1: row.line1,
    line2: row.line2,
    landmark: row.landmark,
    pincode: row.pincode,
    city: row.city,
    lat: row.lat,
    lng: row.lng,
    isDefault: row.isDefault,
  };
}

export async function listAddresses(userId: string) {
  const rows = await db
    .select()
    .from(address)
    .where(eq(address.userId, userId))
    .orderBy(address.createdAt);
  return rows.map(toPublicAddress);
}

/** Clears every default for this user — the caller sets the new default
 * explicitly afterward, so there's never more than one at a time. */
async function clearDefaults(userId: string) {
  await db
    .update(address)
    .set({ isDefault: false })
    .where(and(eq(address.userId, userId), eq(address.isDefault, true)));
}

export async function createAddress(userId: string, input: AddressInput) {
  const [existingCount] = await db
    .select({ id: address.id })
    .from(address)
    .where(eq(address.userId, userId))
    .limit(1);

  // First address for this user is always the default, regardless of what
  // was passed in — there must be exactly one default once any exist.
  const isDefault = input.isDefault || !existingCount;

  if (isDefault) {
    await clearDefaults(userId);
  }

  const [row] = await db
    .insert(address)
    .values({
      userId,
      label: input.label,
      name: input.name,
      phone: input.phone,
      line1: input.line1,
      line2: input.line2,
      landmark: input.landmark ?? null,
      pincode: input.pincode,
      city: input.city,
      lat: input.lat ?? null,
      lng: input.lng ?? null,
      isDefault,
    })
    .returning();

  if (!row) {
    throw notFound("Address");
  }

  return toPublicAddress(row);
}

async function assertOwned(userId: string, id: string) {
  const [row] = await db
    .select({ id: address.id })
    .from(address)
    .where(and(eq(address.id, id), eq(address.userId, userId)))
    .limit(1);

  if (!row) {
    throw notFound("Address");
  }
}

export async function updateAddress(
  userId: string,
  id: string,
  input: AddressInput,
) {
  await assertOwned(userId, id);

  if (input.isDefault) {
    await clearDefaults(userId);
  }

  const [row] = await db
    .update(address)
    .set({
      label: input.label,
      name: input.name,
      phone: input.phone,
      line1: input.line1,
      line2: input.line2,
      landmark: input.landmark ?? null,
      pincode: input.pincode,
      city: input.city,
      lat: input.lat ?? null,
      lng: input.lng ?? null,
      isDefault: input.isDefault,
    })
    .where(and(eq(address.id, id), eq(address.userId, userId)))
    .returning();

  if (!row) {
    throw notFound("Address");
  }

  return toPublicAddress(row);
}

export async function deleteAddress(userId: string, id: string) {
  await assertOwned(userId, id);

  const wasDefault = await db
    .select({ isDefault: address.isDefault })
    .from(address)
    .where(and(eq(address.id, id), eq(address.userId, userId)))
    .then((rows) => rows[0]?.isDefault ?? false);

  await db
    .delete(address)
    .where(and(eq(address.id, id), eq(address.userId, userId)));

  // Promote the oldest remaining address to default so there's never a gap.
  if (wasDefault) {
    const [next] = await db
      .select({ id: address.id })
      .from(address)
      .where(eq(address.userId, userId))
      .orderBy(address.createdAt)
      .limit(1);

    if (next) {
      await db
        .update(address)
        .set({ isDefault: true })
        .where(eq(address.id, next.id));
    }
  }
}

export async function setDefaultAddress(userId: string, id: string) {
  await assertOwned(userId, id);
  await clearDefaults(userId);
  await db
    .update(address)
    .set({ isDefault: true })
    .where(and(eq(address.id, id), eq(address.userId, userId)));
}
