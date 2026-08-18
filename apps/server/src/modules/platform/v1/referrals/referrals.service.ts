import { randomUUID } from "node:crypto";

import { ERROR_CODES } from "@/core/constants";
import { badRequest, conflict } from "@/core/errors";
import { toPaise, toWholeRupees } from "@/lib/money";
import * as repo from "./referrals.repo";

function addDays(base: Date, days: number): Date {
  const next = new Date(base);
  next.setDate(next.getDate() + days);
  return next;
}

function addHours(base: Date, hours: number): Date {
  return new Date(base.getTime() + hours * 60 * 60 * 1000);
}

/** "Ananya" → "ANANYA150" style code — first name, cleaned, plus a random
 * 3-digit suffix. Retries on collision (extremely rare at 900 possibilities
 * per name, but not impossible). */
async function generateUniqueCode(name: string): Promise<string> {
  const base =
    name
      .trim()
      .split(/\s+/)[0]
      ?.replace(/[^a-zA-Z]/g, "")
      .toUpperCase()
      .slice(0, 12) || "MUMZO";

  for (let attempt = 0; attempt < 10; attempt++) {
    const suffix = Math.floor(100 + Math.random() * 900);
    const candidate = `${base}${suffix}`;
    if (!(await repo.codeExists(candidate))) {
      return candidate;
    }
  }

  // Falls back to a UUID fragment if the 900-slot space somehow keeps
  // colliding — guarantees termination without an unbounded loop.
  return `${base}${randomUUID().slice(0, 6).toUpperCase()}`;
}

/** Gets (or lazily creates) the signed-in user's referral code. */
export async function getOrCreateMyCode(userId: string, userName: string) {
  const existing = await repo.findUserCode(userId);
  if (existing) {
    return existing;
  }

  const code = await generateUniqueCode(userName);
  return repo.insertUserCode(userId, code);
}

export async function getProgram() {
  const [tiers, rules] = await Promise.all([
    repo.findActiveTiers(),
    repo.getRules(),
  ]);
  return {
    tiers: tiers.map((tier) => ({
      id: tier.id,
      name: tier.name,
      threshold: tier.threshold,
      couponAmount: toWholeRupees(tier.couponAmount),
    })),
    refereeReward: rules.refereeRewardRupees,
  };
}

export async function validateCode(code: string, viewerUserId?: string) {
  const row = await repo.findByCode(code.toUpperCase());
  if (!row) {
    throw badRequest(
      "This referral code doesn't exist.",
      ERROR_CODES.REFERRAL_CODE_INVALID,
    );
  }
  const [referrerName, rules] = await Promise.all([
    repo.findUserName(row.userId),
    repo.getRules(),
  ]);
  return {
    valid: true as const,
    code: row.code,
    referrerName: referrerName ?? "A friend",
    refereeReward: rules.refereeRewardRupees,
    isSelf: viewerUserId !== undefined && viewerUserId === row.userId,
  };
}

/**
 * Applies a referral code at signup — the friend now has an account. This is
 * the *only* place a referral row is created: landing on `/r/:code` without
 * signing up leaves no trace, so a referrer's invite feed only ever shows
 * people who actually joined. Self-referral is blocked; a person can only
 * ever be referred once.
 */
export async function applyCodeOnSignup(refereeUserId: string, code: string) {
  const owner = await repo.findByCode(code.toUpperCase());
  if (!owner) {
    throw badRequest(
      "This referral code doesn't exist.",
      ERROR_CODES.REFERRAL_CODE_INVALID,
    );
  }

  if (owner.userId === refereeUserId) {
    throw badRequest(
      "You can't use your own referral code.",
      ERROR_CODES.REFERRAL_SELF_REFERRAL,
    );
  }

  const alreadyReferred = await repo.findReferralByReferee(refereeUserId);
  if (alreadyReferred) {
    throw conflict("You've already used a referral code.");
  }

  const rules = await repo.getRules();
  const now = new Date();
  const welcomeCouponCode = `WELCOME${rules.refereeRewardRupees}-${randomUUID()
    .slice(0, 5)
    .toUpperCase()}`;
  const refereeCouponId = await repo.issueRefereeCoupon({
    refereeUserId,
    code: welcomeCouponCode,
    amountPaise: toPaise(rules.refereeRewardRupees),
    expiresAt: addDays(now, rules.couponValidityDays),
  });

  await repo.insertReferral({
    referrerUserId: owner.userId,
    refereeUserId,
    codeUsed: owner.code,
    status: "signed_up",
    refereeCouponId,
  });
}

/**
 * Called from the order-status hook when a referee's order is confirmed —
 * moves their referral row from `signed_up` to `order_placed`. No-op if the
 * referee has no pending referral (most orders aren't from referred users).
 */
export async function onFirstOrderPlaced(
  refereeUserId: string,
  orderId: string,
) {
  const active = await repo.findReferralByReferee(refereeUserId);
  if (!active) {
    return;
  }

  const row = await repo.findReferralById(active.id);
  if (row?.status !== "signed_up") {
    return; // Not the referee's first order, or already progressed.
  }

  await repo.updateReferral(row.id, {
    status: "order_placed",
    firstOrderId: orderId,
  });
}

/**
 * Called from the order-status hook on `delivered` — starts the return-
 * window timer the settlement sweep watches. When the admin has enabled
 * `settleOnDelivery`, this also settles the referral immediately instead of
 * waiting for the sweep — the reward is available sooner, at the cost of
 * the return-window fraud protection.
 */
export async function onOrderDelivered(orderId: string) {
  const row = await repo.findReferralByOrderId(orderId);
  if (row?.status !== "order_placed") {
    return;
  }

  const rules = await repo.getRules();
  const deliveredAt = new Date();
  await repo.updateReferral(row.id, {
    deliveredAt,
    returnWindowEnd: addHours(deliveredAt, rules.returnWindowHours),
  });

  if (rules.settleOnDelivery) {
    await settleReferral(row.id);
  }
}

/**
 * Called from the order-status hook on `returned` — the referral never
 * counts, and any already-issued coupon (a settlement/return race) is
 * revoked.
 */
export async function onOrderReturned(orderId: string) {
  const row = await repo.findReferralByOrderId(orderId);

  // No referral tracks this order, or it already settled to a terminal
  // state — a `completed` referral has crossed the return window and its
  // coupon is final by the settlement engine's own guarantee.
  if (!row || row.status === "returned" || row.status === "completed") {
    return;
  }

  await repo.updateReferral(row.id, { status: "returned" });

  if (row.couponId) {
    await repo.revokeCoupon(row.couponId);
  }
}

/**
 * The settlement sweep's unit of work: one referral whose return window has
 * passed with no return. Marks it `completed`, increments the referrer's
 * count, and issues a coupon at the referrer's *current* tier rate — every
 * successful referral pays out, not just the ones that land exactly on a
 * tier threshold. The rate is the highest active tier whose threshold the
 * referrer has now reached (so referral #3 under tiers at 1/2/5 still pays
 * tier 2's rate, not nothing).
 *
 * Runs one referral at a time (not batched) so a single bad row can't abort
 * the whole sweep — the caller loops and catches per-row.
 */
export async function settleReferral(referralId: string) {
  const row = await repo.findReferralById(referralId);
  if (row?.status !== "order_placed") {
    return null; // Already handled, or moved on since the sweep queued it.
  }

  const completedAt = new Date();
  await repo.updateReferral(row.id, { status: "completed", completedAt });

  const updatedCode = await repo.incrementSuccessfulReferrals(
    row.referrerUserId,
  );

  const tiers = await repo.findActiveTiers();
  const currentTier = tiers
    .filter((tier) => tier.threshold <= updatedCode.successfulReferrals)
    .at(-1);

  if (!currentTier) {
    return { referralId: row.id, couponId: null };
  }

  const rules = await repo.getRules();

  // Monthly earn cap: the referral itself still counts (status/tally above
  // already committed) — only the *reward* is withheld once a referrer has
  // hit their cap for the current calendar month. 0 = uncapped.
  if (rules.monthlyCapPerUser > 0) {
    const monthStart = new Date(
      completedAt.getFullYear(),
      completedAt.getMonth(),
      1,
    );
    const issuedThisMonth = await repo.countReferralCouponsIssuedSince(
      row.referrerUserId,
      monthStart,
    );
    if (issuedThisMonth >= rules.monthlyCapPerUser) {
      return { referralId: row.id, couponId: null, capped: true as const };
    }
  }

  const referrerName = await repo.findUserName(row.referrerUserId);
  const couponCode = `REF${toWholeRupees(currentTier.couponAmount)}-${randomUUID()
    .slice(0, 5)
    .toUpperCase()}`;

  const couponId = await repo.issueTierCoupon({
    referrerUserId: row.referrerUserId,
    code: couponCode,
    amountPaise: currentTier.couponAmount,
    // Usable immediately — no separate claim step. `settleOnDelivery` only
    // decides *when* settlement (this function) runs, not whether the
    // reward needs claiming afterward.
    expiresAt: addDays(completedAt, rules.couponValidityDays),
  });

  await repo.updateReferral(row.id, { couponId });

  return {
    referralId: row.id,
    couponId,
    referrerName,
    tierName: currentTier.name,
    amount: toWholeRupees(currentTier.couponAmount),
  };
}

/** The customer-facing "my referrals" payload. */
export async function getMyReferrals(userId: string, userName: string) {
  const codeRow = await getOrCreateMyCode(userId, userName);
  const [invites, coupons, orderCount] = await Promise.all([
    repo.listInvitesForReferrer(userId),
    repo.listCouponsForReferrer(userId),
    repo.countUserOrders(userId),
  ]);

  const now = new Date();

  return {
    code: codeRow.code,
    hasOrdered: orderCount > 0,
    successfulReferrals: codeRow.successfulReferrals,
    invites: invites.map((invite) => ({
      id: invite.id,
      refereeName: invite.refereeName ?? "Pending signup",
      status: invite.status as
        | "link_shared"
        | "signed_up"
        | "order_placed"
        | "completed"
        | "returned",
      updatedAt: invite.updatedAt.toISOString(),
    })),
    coupons: coupons.map((c) => ({
      id: c.id,
      code: c.code,
      discountAmount: toWholeRupees(c.value),
      status: !c.isActive
        ? ("revoked" as const)
        : c.expiresAt < now
          ? ("expired" as const)
          : c.usedCount >= (c.maxUses ?? 1)
            ? ("used" as const)
            : ("active" as const),
      expiresAt: c.expiresAt.toISOString(),
    })),
  };
}
