import { randomUUID } from "node:crypto";

import { ERROR_CODES } from "@/core/constants";
import { badRequest, conflict } from "@/core/errors";
import { toWholeRupees } from "@/lib/money";
import * as repo from "./referrals.repo";

/** Days a friend's order stays returnable — settlement waits this long
 * before a `order_placed` referral can become `completed`. Matches
 * docs/platform/referral_system_architecture.md §4. */
const RETURN_WINDOW_DAYS = 7;
/** Days an issued coupon stays redeemable. */
const COUPON_VALIDITY_DAYS = 90;

function addDays(base: Date, days: number): Date {
  const next = new Date(base);
  next.setDate(next.getDate() + days);
  return next;
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
  const tiers = await repo.findActiveTiers();
  return {
    tiers: tiers.map((tier) => ({
      id: tier.id,
      name: tier.name,
      threshold: tier.threshold,
      couponAmount: toWholeRupees(tier.couponAmount),
    })),
  };
}

export async function validateCode(code: string) {
  const row = await repo.findByCode(code.toUpperCase());
  if (!row) {
    throw badRequest(
      "This referral code doesn't exist.",
      ERROR_CODES.REFERRAL_CODE_INVALID,
    );
  }
  return { valid: true as const, code: row.code };
}

/**
 * Records a `link_shared` referral row when a friend clicks `/r/:code`,
 * before any account exists on their side. Anonymous — `refereeUserId` is
 * null until they sign up. Idempotent per (code, no identity yet) is not
 * meaningful without a device/session concept, so every click inserts a new
 * row; harmless, since `link_shared` rows with no signup never settle.
 */
export async function trackClick(code: string) {
  const owner = await repo.findByCode(code.toUpperCase());
  if (!owner) {
    throw badRequest(
      "This referral code doesn't exist.",
      ERROR_CODES.REFERRAL_CODE_INVALID,
    );
  }

  await repo.insertReferral({
    referrerUserId: owner.userId,
    refereeUserId: null,
    codeUsed: owner.code,
    status: "link_shared",
  });
}

/**
 * Applies a referral code at signup — the friend now has an account.
 * Promotes an existing `link_shared` row for this code if one exists
 * (linking it to the new account), otherwise creates a fresh `signed_up`
 * row. Self-referral is blocked; a person can only ever be referred once.
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

  await repo.insertReferral({
    referrerUserId: owner.userId,
    refereeUserId,
    codeUsed: owner.code,
    status: "signed_up",
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
 * window timer the settlement sweep watches.
 */
export async function onOrderDelivered(orderId: string) {
  const row = await repo.findReferralByOrderId(orderId);
  if (row?.status !== "order_placed") {
    return;
  }

  const deliveredAt = new Date();
  await repo.updateReferral(row.id, {
    deliveredAt,
    returnWindowEnd: addDays(deliveredAt, RETURN_WINDOW_DAYS),
  });
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
 * count, and issues a coupon for every newly-crossed tier threshold.
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
  const justUnlocked = tiers.find(
    (tier) => tier.threshold === updatedCode.successfulReferrals,
  );

  if (!justUnlocked) {
    return { referralId: row.id, couponId: null };
  }

  const referrerName = await repo.findUserName(row.referrerUserId);
  const couponCode = `REF${toWholeRupees(justUnlocked.couponAmount)}-${randomUUID()
    .slice(0, 5)
    .toUpperCase()}`;

  const couponId = await repo.issueTierCoupon({
    referrerUserId: row.referrerUserId,
    code: couponCode,
    amountPaise: justUnlocked.couponAmount,
    expiresAt: addDays(completedAt, COUPON_VALIDITY_DAYS),
  });

  await repo.updateReferral(row.id, { couponId });

  return {
    referralId: row.id,
    couponId,
    referrerName,
    tierName: justUnlocked.name,
    amount: toWholeRupees(justUnlocked.couponAmount),
  };
}

/** The customer-facing "my referrals" payload. */
export async function getMyReferrals(userId: string, userName: string) {
  const codeRow = await getOrCreateMyCode(userId, userName);
  const [invites, coupons] = await Promise.all([
    repo.listInvitesForReferrer(userId),
    repo.listCouponsForReferrer(userId),
  ]);

  const now = new Date();

  return {
    code: codeRow.code,
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
