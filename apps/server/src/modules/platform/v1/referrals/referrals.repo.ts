import { db } from "@mumzo/db";
import { user } from "@mumzo/db/schema/auth";
import { order } from "@mumzo/db/schema/commerce";
import { coupon, couponAssignment } from "@mumzo/db/schema/marketing";
import {
  referral,
  referralRules,
  referralTier,
  userReferralCode,
} from "@mumzo/db/schema/referrals";
import { and, count, eq, gt, lte, ne, sql } from "drizzle-orm";

/** Pure data access — no business rules. `referrals.service.ts` owns those. */

/** The singleton config row's fixed id — see the schema docblock. */
const RULES_ROW_ID = "default";

/** Hardcoded fallback used only to seed the row the very first time it's
 * read — after that, the DB row is the sole source of truth and this
 * default is never consulted again. */
const FALLBACK_RULES = {
  returnWindowHours: 1,
  couponValidityDays: 90,
  monthlyCapPerUser: 5,
  refereeRewardRupees: 150,
  refereeMinOrderRupees: 499,
  selfReferralBlock: true,
  codePattern: "{NAME}{RANDOM3}",
};

/** Reads the programme rules, lazily creating the singleton row with
 * fallback defaults on first read (a fresh database has no row yet). */
export async function getRules() {
  const [row] = await db
    .select()
    .from(referralRules)
    .where(eq(referralRules.id, RULES_ROW_ID))
    .limit(1);
  if (row) {
    return row;
  }

  const [created] = await db
    .insert(referralRules)
    .values({ id: RULES_ROW_ID, ...FALLBACK_RULES })
    .onConflictDoNothing()
    .returning();
  if (created) {
    return created;
  }

  // Lost a race with a concurrent first-read — re-select the row the other
  // request just created rather than erroring.
  const [row2] = await db
    .select()
    .from(referralRules)
    .where(eq(referralRules.id, RULES_ROW_ID))
    .limit(1);
  if (!row2) {
    throw new Error("referral_rules singleton row missing after insert race.");
  }
  return row2;
}

export async function updateRules(
  values: Partial<{
    returnWindowHours: number;
    couponValidityDays: number;
    monthlyCapPerUser: number;
    refereeRewardRupees: number;
    refereeMinOrderRupees: number;
    selfReferralBlock: boolean;
    codePattern: string;
    settleOnDelivery: boolean;
  }>,
) {
  await getRules(); // Ensures the row exists before the update targets it.
  const [row] = await db
    .update(referralRules)
    .set(values)
    .where(eq(referralRules.id, RULES_ROW_ID))
    .returning();
  if (!row) {
    throw new Error("Update to referral_rules returned no row.");
  }
  return row;
}

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
  refereeCouponId?: string | null;
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
    refereeCouponId: string | null;
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
export async function findDueForSettlement(now: Date, limit: number) {
  return db
    .select()
    .from(referral)
    .where(
      and(
        eq(referral.status, "order_placed"),
        lte(referral.returnWindowEnd, now),
      ),
    )
    .orderBy(referral.returnWindowEnd)
    .limit(limit);
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

/** Tier coupons the user earned as a *referrer* — joined via
 * `referral.couponId`, the back-reference set only when a coupon is issued
 * for reaching a tier milestone. Deliberately excludes welcome/referee
 * coupons (`referral.refereeCouponId`), which surface separately via
 * `/coupons/me` — otherwise the same coupon would double up on both. */
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
    .innerJoin(referral, eq(referral.couponId, coupon.id))
    .where(eq(referral.referrerUserId, referrerUserId))
    .orderBy(coupon.createdAt);
}

/** Count of this user's own non-cancelled orders — gates whether the
 * referral programme is active for them (referring is only meaningful
 * after they've shopped once themselves). */
export async function countUserOrders(userId: string) {
  const [row] = await db
    .select({ value: count() })
    .from(order)
    .where(and(eq(order.userId, userId), ne(order.status, "cancelled")));
  return row?.value ?? 0;
}

/**
 * Issues one coupon for a tier milestone: inserts into the shared `coupon`
 * table and assigns it to the referrer. Single-use (`maxUses: 1`),
 * non-stackable, no minimum order. Usable immediately — there is no
 * separate claim step; the validity window starts at issuance.
 */
export async function issueTierCoupon(input: {
  referrerUserId: string;
  code: string;
  amountPaise: number;
  minAmtPaise: number;
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
        minAmt: input.minAmtPaise,
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

/**
 * Issues the referee's one-time welcome coupon at signup — same shape as
 * `issueTierCoupon` but `firstOrderOnly` (only the friend's very first
 * order should get the discount) and assigned to the referee, not referrer.
 */
export async function issueRefereeCoupon(input: {
  refereeUserId: string;
  code: string;
  amountPaise: number;
  minAmtPaise: number;
  expiresAt: Date;
}) {
  return db.transaction(async (tx) => {
    const [row] = await tx
      .insert(coupon)
      .values({
        code: input.code,
        description: "Referral welcome reward",
        type: "flat",
        value: input.amountPaise,
        cap: null,
        minAmt: input.minAmtPaise,
        productScope: "all",
        visibility: "assigned",
        firstOrderOnly: true,
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
      .values({ couponId: row.id, userId: input.refereeUserId });

    return row.id;
  });
}

/** Any coupon assigned to this user via `couponAssignment` — covers referral
 * rewards (referrer tier coupons, referee welcome coupons) and any future
 * manually-assigned marketing coupon, not just referral ones. */
export async function listAssignedCouponsForUser(userId: string) {
  const referrer = db
    .select({ name: user.name })
    .from(referral)
    .innerJoin(user, eq(user.id, referral.referrerUserId))
    .where(eq(referral.refereeCouponId, coupon.id))
    .limit(1);

  return db
    .select({
      id: coupon.id,
      code: coupon.code,
      description: coupon.description,
      type: coupon.type,
      value: coupon.value,
      minAmt: coupon.minAmt,
      isActive: coupon.isActive,
      expiresAt: coupon.expiresAt,
      usedCount: coupon.usedCount,
      maxUses: coupon.maxUses,
      createdAt: coupon.createdAt,
      // A friend's name when this coupon is a referral welcome reward —
      // null for any other assigned coupon (ordinary marketing assignment).
      referrerName: sql<string | null>`(${referrer})`,
    })
    .from(coupon)
    .innerJoin(couponAssignment, eq(couponAssignment.couponId, coupon.id))
    .where(eq(couponAssignment.userId, userId))
    .orderBy(coupon.createdAt);
}

/** Count of active/current-month referral coupons already issued to this
 * referrer — the settlement engine's monthly-cap gate reads this before
 * minting a new tier coupon. */
export async function countReferralCouponsIssuedSince(
  referrerUserId: string,
  since: Date,
) {
  const [row] = await db
    .select({ value: count() })
    .from(coupon)
    .innerJoin(couponAssignment, eq(couponAssignment.couponId, coupon.id))
    .where(
      and(
        eq(couponAssignment.userId, referrerUserId),
        eq(coupon.description, "Referral reward"),
        gt(coupon.createdAt, since),
      ),
    );
  return row?.value ?? 0;
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
