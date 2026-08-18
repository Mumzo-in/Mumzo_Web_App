import { db } from "@mumzo/db";
import { user } from "@mumzo/db/schema/auth";
import { order } from "@mumzo/db/schema/commerce";
import { coupon, couponAssignment } from "@mumzo/db/schema/marketing";
import {
  referral,
  referralTier,
  userReferralCode,
} from "@mumzo/db/schema/referrals";
import { and, count, desc, eq, gt, ilike, or, sql } from "drizzle-orm";

/** Pure data access — no business rules. `referrals.service.ts` owns those. */

export async function findAllTiers() {
  return db.select().from(referralTier).orderBy(referralTier.threshold);
}

export async function findTierById(id: string) {
  const [row] = await db
    .select()
    .from(referralTier)
    .where(eq(referralTier.id, id))
    .limit(1);
  return row ?? null;
}

export async function findTierByThreshold(threshold: number) {
  const [row] = await db
    .select()
    .from(referralTier)
    .where(eq(referralTier.threshold, threshold))
    .limit(1);
  return row ?? null;
}

export async function insertTier(values: {
  name: string;
  threshold: number;
  couponAmount: number;
  minOrderAmount: number;
  splitCount: number;
  isActive: boolean;
  sortOrder: number;
}) {
  const [row] = await db.insert(referralTier).values(values).returning();
  if (!row) {
    throw new Error("Insert into referral_tier returned no row.");
  }
  return row;
}

export async function updateTier(
  id: string,
  values: Partial<{
    name: string;
    threshold: number;
    couponAmount: number;
    minOrderAmount: number;
    splitCount: number;
    isActive: boolean;
    sortOrder: number;
  }>,
) {
  await db.update(referralTier).set(values).where(eq(referralTier.id, id));
}

export async function deleteTier(id: string) {
  await db.delete(referralTier).where(eq(referralTier.id, id));
}

export async function tierMemberCounts() {
  return db
    .select({
      threshold: referralTier.threshold,
      count: sql<number>`count(${userReferralCode.id})::int`,
    })
    .from(referralTier)
    .leftJoin(
      userReferralCode,
      sql`${userReferralCode.successfulReferrals} >= ${referralTier.threshold}`,
    )
    .groupBy(referralTier.threshold);
}

export async function countReferralsByStatus(status: string) {
  const [row] = await db
    .select({ value: count() })
    .from(referral)
    .where(eq(referral.status, status));
  return row?.value ?? 0;
}

/** Users who have referred at least one friend successfully. */
export async function countTotalReferrers() {
  const [row] = await db
    .select({ value: count() })
    .from(userReferralCode)
    .where(gt(userReferralCode.successfulReferrals, 0));
  return row?.value ?? 0;
}

export async function sumCouponsPaidSince(since: Date) {
  const [row] = await db
    .select({ value: sql<number>`coalesce(sum(${coupon.value}), 0)::int` })
    .from(coupon)
    .innerJoin(couponAssignment, eq(couponAssignment.couponId, coupon.id))
    .innerJoin(
      referral,
      and(
        eq(referral.couponId, coupon.id),
        sql`${referral.completedAt} >= ${since}`,
      ),
    );
  return row?.value ?? 0;
}

export async function findFunnelCounts() {
  const rows = await db
    .select({ status: referral.status, value: count() })
    .from(referral)
    .groupBy(referral.status);

  const byStatus = new Map(rows.map((r) => [r.status, r.value]));
  return {
    linkShared: byStatus.get("link_shared") ?? 0,
    signedUp: byStatus.get("signed_up") ?? 0,
    orderPlaced: byStatus.get("order_placed") ?? 0,
    completed: byStatus.get("completed") ?? 0,
  };
}

export async function findRecentActivity(limit: number) {
  return db
    .select({
      id: referral.id,
      referrerName: user.name,
      status: referral.status,
      updatedAt: referral.updatedAt,
    })
    .from(referral)
    .innerJoin(user, eq(referral.referrerUserId, user.id))
    .orderBy(desc(referral.updatedAt))
    .limit(limit);
}

export async function findParticipantsPage(filters: {
  page: number;
  limit: number;
  search?: string;
}) {
  const conditions = [
    filters.search
      ? or(
          ilike(user.name, `%${filters.search}%`),
          ilike(userReferralCode.code, `%${filters.search}%`),
        )
      : undefined,
  ].filter((c) => c !== undefined);

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [rows, countRows] = await Promise.all([
    db
      .select({
        id: userReferralCode.id,
        userId: userReferralCode.userId,
        name: user.name,
        code: userReferralCode.code,
        successfulReferrals: userReferralCode.successfulReferrals,
        createdAt: userReferralCode.createdAt,
      })
      .from(userReferralCode)
      .innerJoin(user, eq(userReferralCode.userId, user.id))
      .where(where)
      .orderBy(desc(userReferralCode.successfulReferrals))
      .limit(filters.limit)
      .offset((filters.page - 1) * filters.limit),
    db
      .select({ value: count() })
      .from(userReferralCode)
      .innerJoin(user, eq(userReferralCode.userId, user.id))
      .where(where),
  ]);

  return { rows, total: countRows[0]?.value ?? 0 };
}

export async function totalReferredByUser(userId: string) {
  const [row] = await db
    .select({ value: count() })
    .from(referral)
    .where(eq(referral.referrerUserId, userId));
  return row?.value ?? 0;
}

export async function couponsIssuedByUser(userId: string) {
  const [row] = await db
    .select({ value: count() })
    .from(coupon)
    .innerJoin(couponAssignment, eq(couponAssignment.couponId, coupon.id))
    .where(eq(couponAssignment.userId, userId));
  return row?.value ?? 0;
}

export async function findParticipantByUserId(userId: string) {
  const [row] = await db
    .select({
      id: userReferralCode.id,
      userId: userReferralCode.userId,
      name: user.name,
      code: userReferralCode.code,
      successfulReferrals: userReferralCode.successfulReferrals,
      createdAt: userReferralCode.createdAt,
    })
    .from(userReferralCode)
    .innerJoin(user, eq(userReferralCode.userId, user.id))
    .where(eq(userReferralCode.userId, userId))
    .limit(1);
  return row ?? null;
}

export async function listInvitesForReferrer(referrerUserId: string) {
  return db
    .select({
      id: referral.id,
      refereeName: user.name,
      status: referral.status,
      updatedAt: referral.updatedAt,
    })
    .from(referral)
    .leftJoin(user, eq(referral.refereeUserId, user.id))
    .where(eq(referral.referrerUserId, referrerUserId))
    .orderBy(desc(referral.updatedAt));
}

/**
 * Coupon status is derived, not stored — mirrors the exact rule
 * `referrals.service.ts` uses to serialize a row, so a status filter here
 * matches what the client sees. Referral coupons are always `maxUses: 1`.
 */
function statusCondition(status: string) {
  const now = sql`now()`;
  switch (status) {
    case "revoked":
      return eq(coupon.isActive, false);
    case "expired":
      return and(eq(coupon.isActive, true), sql`${coupon.expiresAt} < ${now}`);
    case "used":
      return and(
        eq(coupon.isActive, true),
        sql`${coupon.expiresAt} >= ${now}`,
        sql`${coupon.usedCount} >= coalesce(${coupon.maxUses}, 1)`,
      );
    case "active":
      return and(
        eq(coupon.isActive, true),
        sql`${coupon.expiresAt} >= ${now}`,
        sql`${coupon.usedCount} < coalesce(${coupon.maxUses}, 1)`,
      );
    default:
      return undefined;
  }
}

export async function findCouponsPage(filters: {
  page: number;
  limit: number;
  search?: string;
  status?: string;
}) {
  const conditions = [
    filters.search
      ? or(
          ilike(coupon.code, `%${filters.search}%`),
          ilike(user.name, `%${filters.search}%`),
        )
      : undefined,
    filters.status ? statusCondition(filters.status) : undefined,
  ].filter((c) => c !== undefined);

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [rows, countRows] = await Promise.all([
    db
      .select({
        id: coupon.id,
        code: coupon.code,
        referrerName: user.name,
        value: coupon.value,
        isActive: coupon.isActive,
        usedCount: coupon.usedCount,
        maxUses: coupon.maxUses,
        expiresAt: coupon.expiresAt,
        createdAt: coupon.createdAt,
        usedInOrderId: order.id,
      })
      .from(coupon)
      .innerJoin(couponAssignment, eq(couponAssignment.couponId, coupon.id))
      .innerJoin(user, eq(couponAssignment.userId, user.id))
      .leftJoin(order, eq(order.couponId, coupon.id))
      .where(where)
      .orderBy(desc(coupon.createdAt))
      .limit(filters.limit)
      .offset((filters.page - 1) * filters.limit),
    db
      .select({ value: count() })
      .from(coupon)
      .innerJoin(couponAssignment, eq(couponAssignment.couponId, coupon.id))
      .innerJoin(user, eq(couponAssignment.userId, user.id))
      .where(where),
  ]);

  return { rows, total: countRows[0]?.value ?? 0 };
}
