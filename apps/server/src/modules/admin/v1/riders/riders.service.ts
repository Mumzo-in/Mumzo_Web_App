import { randomInt } from "node:crypto";
import { db, deliveryLink, hub, rider } from "@mumzo/db";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";

import { badRequest, conflict, notFound } from "@/core/errors";

/** Delivery partners (riders) — the people who take orders out. */

/** Codes are 6 digits: short enough to read over the phone and type on a
 * doorstep, wide enough that guessing one is impractical against the
 * 10-attempt lockout on each link. */
const CODE_DIGITS = 6;
const CODE_MIN = 10 ** (CODE_DIGITS - 1);
const CODE_MAX = 10 ** CODE_DIGITS;

/**
 * Allocate an unused access code. Generated on create so ops never has to
 * issue one; retries on the (vanishingly rare) unique collision rather than
 * trusting a single draw.
 */
async function generateAccessCode(): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const candidate = String(randomInt(CODE_MIN, CODE_MAX));
    const [clash] = await db
      .select({ id: rider.id })
      .from(rider)
      .where(eq(rider.accessCode, candidate))
      .limit(1);
    if (!clash) {
      return candidate;
    }
  }
  throw badRequest("Could not allocate a delivery code. Try again.");
}

export type ListRidersParams = {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
};

export async function listRiders(params: ListRidersParams) {
  const page = params.page ?? 1;
  const limit = params.limit ?? 20;
  const needle = params.search?.trim();

  const filters = [
    needle
      ? or(ilike(rider.name, `%${needle}%`), ilike(rider.phone, `%${needle}%`))
      : undefined,
    params.status ? eq(rider.status, params.status) : undefined,
  ].filter(Boolean);

  const where = filters.length ? and(...filters) : undefined;

  const rows = await db
    .select({
      id: rider.id,
      name: rider.name,
      phone: rider.phone,
      email: rider.email,
      status: rider.status,
      hubId: rider.hubId,
      hubName: hub.name,
      vehicleType: rider.vehicleType,
      vehicleNumber: rider.vehicleNumber,
      accessCode: rider.accessCode,
      kycVerified: rider.kycVerified,
      totalDeliveries: rider.totalDeliveries,
      createdAt: rider.createdAt,
    })
    .from(rider)
    .leftJoin(hub, eq(hub.id, rider.hubId))
    .where(where)
    .orderBy(desc(rider.createdAt))
    .limit(limit)
    .offset((page - 1) * limit);

  const [totals] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(rider)
    .where(where);
  const count = totals?.count ?? 0;

  return {
    data: rows.map((row) => ({
      ...row,
      createdAt: row.createdAt.toISOString(),
    })),
    meta: { page, limit, total: count, hasNext: page * limit < count },
  };
}

export async function getRider(id: string) {
  const [row] = await db
    .select({
      id: rider.id,
      name: rider.name,
      phone: rider.phone,
      email: rider.email,
      status: rider.status,
      hubId: rider.hubId,
      hubName: hub.name,
      vehicleType: rider.vehicleType,
      vehicleNumber: rider.vehicleNumber,
      licenseNumber: rider.licenseNumber,
      accessCode: rider.accessCode,
      kycVerified: rider.kycVerified,
      totalDeliveries: rider.totalDeliveries,
      createdAt: rider.createdAt,
    })
    .from(rider)
    .leftJoin(hub, eq(hub.id, rider.hubId))
    .where(eq(rider.id, id))
    .limit(1);

  if (!row) {
    throw notFound("Rider");
  }
  return { ...row, createdAt: row.createdAt.toISOString() };
}

export type RiderInput = {
  name: string;
  phone: string;
  email?: string | null;
  hubId?: string | null;
  status?: string;
  vehicleType?: string | null;
  vehicleNumber?: string | null;
  licenseNumber?: string | null;
  kycVerified?: boolean;
};

async function assertPhoneFree(phone: string, exceptId?: string) {
  const [clash] = await db
    .select({ id: rider.id })
    .from(rider)
    .where(eq(rider.phone, phone))
    .limit(1);
  if (clash && clash.id !== exceptId) {
    throw conflict("A rider with that phone number already exists.");
  }
}

export async function createRider(input: RiderInput) {
  await assertPhoneFree(input.phone);

  const [created] = await db
    .insert(rider)
    .values({
      name: input.name,
      phone: input.phone,
      email: input.email ?? null,
      hubId: input.hubId ?? null,
      status: input.status ?? "active",
      vehicleType: input.vehicleType ?? null,
      vehicleNumber: input.vehicleNumber ?? null,
      licenseNumber: input.licenseNumber ?? null,
      kycVerified: input.kycVerified ?? false,
      accessCode: await generateAccessCode(),
    })
    .returning({ id: rider.id });

  if (!created) {
    throw badRequest("Could not create the rider.");
  }
  return getRider(created.id);
}

export async function updateRider(id: string, input: Partial<RiderInput>) {
  if (input.phone) {
    await assertPhoneFree(input.phone, id);
  }

  const [updated] = await db
    .update(rider)
    .set({
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.phone !== undefined ? { phone: input.phone } : {}),
      ...(input.email !== undefined ? { email: input.email } : {}),
      ...(input.hubId !== undefined ? { hubId: input.hubId } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.vehicleType !== undefined
        ? { vehicleType: input.vehicleType }
        : {}),
      ...(input.vehicleNumber !== undefined
        ? { vehicleNumber: input.vehicleNumber }
        : {}),
      ...(input.licenseNumber !== undefined
        ? { licenseNumber: input.licenseNumber }
        : {}),
      ...(input.kycVerified !== undefined
        ? { kycVerified: input.kycVerified }
        : {}),
    })
    .where(eq(rider.id, id))
    .returning({ id: rider.id });

  if (!updated) {
    throw notFound("Rider");
  }
  return getRider(id);
}

/** Rotate a rider's code — used when one leaks. Old links stop working for
 * the old code immediately, which is the point. */
export async function rotateAccessCode(id: string) {
  const [updated] = await db
    .update(rider)
    .set({ accessCode: await generateAccessCode() })
    .where(eq(rider.id, id))
    .returning({ id: rider.id });

  if (!updated) {
    throw notFound("Rider");
  }
  return getRider(id);
}

/**
 * Riders are referenced by delivery links (the audit trail of who delivered
 * what), so a rider with history is deactivated rather than deleted.
 */
export async function deleteRider(id: string) {
  const [linked] = await db
    .select({ id: deliveryLink.id })
    .from(deliveryLink)
    .where(eq(deliveryLink.riderId, id))
    .limit(1);

  if (linked) {
    await db.update(rider).set({ status: "inactive" }).where(eq(rider.id, id));
    return { deleted: false, deactivated: true };
  }

  const [removed] = await db
    .delete(rider)
    .where(eq(rider.id, id))
    .returning({ id: rider.id });

  if (!removed) {
    throw notFound("Rider");
  }
  return { deleted: true, deactivated: false };
}
