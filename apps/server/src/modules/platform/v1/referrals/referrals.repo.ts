import { db } from "@mumzo/db";
import { user } from "@mumzo/db/schema/auth";
import { order } from "@mumzo/db/schema/commerce";
import { coupon, couponAssignment } from "@mumzo/db/schema/marketing";
import {
  referral,
  referralTier,
  userReferralCode,
} from "@mumzo/db/schema/referrals";
import { and, count, eq, gt, lte, sql } from "drizzle-orm";

/** Pure data access — no business rules. `referrals.service.ts` owns those. */

export async function findActiveTiers() {
  return db
    .select()
    .from(referralTier)
    .where(eq(referralTier.isActive, true))
    .orderBy(referralTier.threshold);
}

export async function findUserCode(userId: string) {
  const [row] = await db
    .select()
    .from(userReferralCode)
    .where(eq(userReferralCode.userId, userId))
    .limit(1);
  return row ?? null;
}

export async function findByCode(code: string) {
  const [row] = await db
    .select()
    .from(userReferralCode)
    .where(eq(userReferralCode.code, code))
    .limit(1);
  return row ?? null;
}

export async function insertUserCode(userId: string, code: string) {
  const [row] = await db
    .insert(userReferralCode)
    .values({ userId, code })
    .returning();
  if (!row) {
    throw new Error("Insert into user_referral_code returned no row.");
  }
  return row;
}

export async function codeExists(code: string) {
  const [row] = await db
    .select({ id: userReferralCode.id })
    .from(userReferralCode)
    .where(eq(userReferralCode.code, code))
    .limit(1);
  return row !== undefined;
}

export async function findReferralByRefereeAndReferrer(
  refereeUserId: string,
  referrerUserId: string,
) {
  const [row] = await db
    .select({ id: referral.id })
    .from(referral)
    .where(
      and(
        eq(referral.refereeUserId, refereeUserId),
        eq(referral.referrerUserId, referrerUserId),
      ),
    )
    .limit(1);
  return row ?? null;
}

/** Has this person ever been *anyone's* referee? A friend can only be referred once. */
export async function findReferralByReferee(refereeUserId: string) {
  const [row] = await db
    .select({ id: referral.id })
    .from(referral)
    .where(eq(referral.refereeUserId, refereeUserId))
    .limit(1);
  return row ?? null;
}

export async function insertReferral(values: {
  referrerUserId: string;
  refereeUserId: string | null;
  codeUsed: string;
  status: string;
}) {
  const [row] = await db.insert(referral).values(values).returning();
  if (!row) {
    throw new Error("Insert into referral returned no row.");
  }
  return row;
}

export async function updateReferral(
  id: string,
  values: Partial<{
    refereeUserId: string | null;
    status: string;
    firstOrderId: string | null;
    deliveredAt: Date | null;
    returnWindowEnd: Date | null;
    completedAt: Date | null;
    couponId: string | null;
  }>,
) {
  await db.update(referral).set(values).where(eq(referral.id, id));
}

export async function findReferralById(id: string) {
  const [row] = await db
    .select()
    .from(referral)
    .where(eq(referral.id, id))
    .limit(1);
  return row ?? null;
}

/** The most recent referral row for a referee still tracking `order_placed`
 * against a specific order — used by order-status webhooks. */
export async function findReferralByOrderId(orderId: string) {
  const [row] = await db
    .select()
    .from(referral)
    .where(eq(referral.firstOrderId, orderId))
    .limit(1);
  return row ?? null;
}

export async function incrementSuccessfulReferrals(userId: string) {
  const [row] = await db
    .update(userReferralCode)
    .set({
      successfulReferrals: sql`${userReferralCode.successfulReferrals} + 1`,
    })
    .where(eq(userReferralCode.userId, userId))
    .returning();
  if (!row) {
    throw new Error("Update to user_referral_code returned no row.");
  }
  return row;
}

export async function findUserName(userId: string) {
  const [row] = await db
    .select({ name: user.name })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);
  return row?.name ?? null;
}

/** Referrals stuck in `order_placed` whose return window has passed — the
 * settlement sweep's work queue. */
export async function findDueForSettlement(now: Date) {
  return db
    .select()
    .from(referral)
    .where(
      and(
        eq(referral.status, "order_placed"),
        lte(referral.returnWindowEnd, now),
      ),
    );
}

export async function listInvitesForReferrer(referrerUserId: string) {
  return db
    .select({
      id: referral.id,
      refereeUserId: referral.refereeUserId,
      refereeName: user.name,
      status: referral.status,
      updatedAt: referral.updatedAt,
    })
    .from(referral)
    .leftJoin(user, eq(referral.refereeUserId, user.id))
    .where(eq(referral.referrerUserId, referrerUserId))
    .orderBy(referral.updatedAt);
}

export async function listCouponsForReferrer(referrerUserId: string) {
  return db
    .select({
      id: coupon.id,
      code: coupon.code,
      value: coupon.value,
      isActive: coupon.isActive,
      expiresAt: coupon.expiresAt,
      usedCount: coupon.usedCount,
      maxUses: coupon.maxUses,
      createdAt: coupon.createdAt,
    })
    .from(coupon)
    .innerJoin(couponAssignment, eq(couponAssignment.couponId, coupon.id))
    .where(eq(couponAssignment.userId, referrerUserId))
    .orderBy(coupon.createdAt);
}

/**
 * Issues one coupon for a tier milestone: inserts into the shared `coupon`
 * table and assigns it to the referrer. Single-use (`maxUses: 1`),
 * non-stackable, no minimum order.
 */
export async function issueTierCoupon(input: {
  referrerUserId: string;
  code: string;
  amountPaise: number;
  expiresAt: Date;
}) {
  return db.transaction(async (tx) => {
    const [row] = await tx
      .insert(coupon)
      .values({
        code: input.code,
        description: "Referral reward",
        type: "flat",
        value: input.amountPaise,
        cap: null,
        minAmt: 0,
        productScope: "all",
        visibility: "assigned",
        firstOrderOnly: false,
        maxUses: 1,
        maxUsesPerUser: 1,
        isStackable: false,
        priority: 0,
        expiresAt: input.expiresAt,
        isActive: true,
        isGlobal: false,
      })
      .returning({ id: coupon.id });

    if (!row) {
      throw new Error("Insert into coupon returned no row.");
    }

    await tx
      .insert(couponAssignment)
      .values({ couponId: row.id, userId: input.referrerUserId });

    return row.id;
  });
}

export async function revokeCoupon(couponId: string) {
  await db
    .update(coupon)
    .set({ isActive: false })
    .where(eq(coupon.id, couponId));
}

export async function findOrderOwner(orderId: string) {
  const [row] = await db
    .select({ userId: order.userId })
    .from(order)
    .where(eq(order.id, orderId))
    .limit(1);
  return row?.userId ?? null;
}

export async function countReferralsByStatus(status: string) {
  const [row] = await db
    .select({ value: count() })
    .from(referral)
    .where(eq(referral.status, status));
  return row?.value ?? 0;
}

/** Users who have referred at least one friend successfully — not just
 * everyone who has a code (most never use it). */
export async function countTotalReferrers() {
  const [row] = await db
    .select({ value: count() })
    .from(userReferralCode)
    .where(gt(userReferralCode.successfulReferrals, 0));
  return row?.value ?? 0;
}
