import { conflict, notFound } from "@/core/errors";
import { toPaise, toWholeRupees } from "@/lib/money";
import * as repo from "./referrals.repo";

/** Programme-wide rules are hardcoded to the settlement engine's constants
 * today (see platform/v1/referrals/referrals.service.ts) — no DB-backed
 * config table exists yet for return window / coupon validity / monthly
 * cap, so this surfaces the effective values as read-only. Making these
 * editable needs a `referral_rules` table, tracked as a follow-up. */
const EFFECTIVE_RULES = {
  returnWindowDays: 7,
  couponValidityDays: 90,
  monthlyCapPerUser: 0, // Not enforced yet.
  refereeReward: 150,
  selfReferralBlock: true,
  codePattern: "{NAME}{RANDOM3}",
};

function serializeTier(
  row: Awaited<ReturnType<typeof repo.findTierById>>,
  membersInTier = 0,
) {
  if (!row) {
    throw notFound("Referral tier");
  }
  return {
    id: row.id,
    name: row.name,
    threshold: row.threshold,
    couponAmount: toWholeRupees(row.couponAmount),
    membersInTier,
    isActive: row.isActive,
  };
}

export async function getConfig() {
  const [tiers, memberCounts] = await Promise.all([
    repo.findAllTiers(),
    repo.tierMemberCounts(),
  ]);

  const countByThreshold = new Map(
    memberCounts.map((row) => [row.threshold, row.count]),
  );

  return {
    isEnabled: true,
    codePattern: EFFECTIVE_RULES.codePattern,
    rules: EFFECTIVE_RULES,
    tiers: tiers.map((tier) =>
      serializeTier(tier, countByThreshold.get(tier.threshold) ?? 0),
    ),
  };
}

export async function getStats() {
  const [successfulReferrals, pendingReferrals, totalReferrers, funnel] =
    await Promise.all([
      repo.countReferralsByStatus("completed"),
      repo.countReferralsByStatus("order_placed"),
      repo.countTotalReferrers(),
      repo.findFunnelCounts(),
    ]);

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const rewardsPaidThisMonthPaise = await repo.sumCouponsPaidSince(monthStart);

  return {
    totalReferrers,
    successfulReferrals,
    pendingReferrals,
    rewardsPaidThisMonth: toWholeRupees(rewardsPaidThisMonthPaise),
    funnel,
  };
}

export async function getActivity(limit = 20) {
  const rows = await repo.findRecentActivity(limit);
  return rows.map((row) => {
    const messages: Record<string, string> = {
      link_shared: "shared a referral link",
      signed_up: "signed up with a referral code",
      order_placed: "placed their first order",
      completed: "unlocked a referral coupon",
      returned: "had their referral reversed (order returned)",
    };
    return {
      id: row.id,
      referrerName: row.referrerName,
      message: messages[row.status] ?? `updated (${row.status})`,
      at: row.updatedAt.toISOString(),
    };
  });
}

export async function createTier(input: {
  name: string;
  threshold: number;
  couponAmount: number;
  isActive: boolean;
  sortOrder: number;
}) {
  const existing = await repo.findTierByThreshold(input.threshold);
  if (existing) {
    throw conflict(`A tier already exists at ${input.threshold} referrals.`);
  }

  return repo.insertTier({
    ...input,
    couponAmount: toPaise(input.couponAmount),
  });
}

export async function updateTier(
  id: string,
  input: Partial<{
    name: string;
    threshold: number;
    couponAmount: number;
    isActive: boolean;
    sortOrder: number;
  }>,
) {
  const current = await repo.findTierById(id);
  if (!current) {
    throw notFound("Referral tier");
  }

  if (input.threshold !== undefined && input.threshold !== current.threshold) {
    const existing = await repo.findTierByThreshold(input.threshold);
    if (existing) {
      throw conflict(`A tier already exists at ${input.threshold} referrals.`);
    }
  }

  await repo.updateTier(id, {
    ...input,
    couponAmount:
      input.couponAmount !== undefined
        ? toPaise(input.couponAmount)
        : undefined,
  });
}

export async function deleteTier(id: string) {
  const current = await repo.findTierById(id);
  if (!current) {
    throw notFound("Referral tier");
  }
  await repo.deleteTier(id);
}

export async function listParticipants(filters: {
  page: number;
  limit: number;
  search?: string;
}) {
  const { rows, total } = await repo.findParticipantsPage(filters);
  const withCoupons = await Promise.all(
    rows.map(async (row) => ({
      id: row.id,
      name: row.name,
      code: row.code,
      totalReferred: await repo.totalReferredByUser(row.userId),
      successfulReferrals: row.successfulReferrals,
      couponsIssued: await repo.couponsIssuedByUser(row.userId),
      joinedAt: row.createdAt.toISOString(),
    })),
  );

  return {
    data: withCoupons,
    meta: {
      page: filters.page,
      limit: filters.limit,
      total,
      hasNext: filters.page * filters.limit < total,
    },
  };
}

export async function getParticipant(userId: string) {
  const row = await repo.findParticipantByUserId(userId);
  if (!row) {
    throw notFound("Referral participant");
  }

  const [totalReferred, couponsIssued] = await Promise.all([
    repo.totalReferredByUser(row.userId),
    repo.couponsIssuedByUser(row.userId),
  ]);

  return {
    id: row.id,
    name: row.name,
    code: row.code,
    totalReferred,
    successfulReferrals: row.successfulReferrals,
    couponsIssued,
    joinedAt: row.createdAt.toISOString(),
  };
}

export async function getParticipantInvites(userId: string) {
  const participant = await repo.findParticipantByUserId(userId);
  if (!participant) {
    throw notFound("Referral participant");
  }

  const rows = await repo.listInvitesForReferrer(participant.userId);
  return rows.map((row) => ({
    id: row.id,
    refereeName: row.refereeName ?? "Pending signup",
    status: row.status as
      | "link_shared"
      | "signed_up"
      | "order_placed"
      | "completed"
      | "returned",
    updatedAt: row.updatedAt.toISOString(),
  }));
}

export async function listCoupons(filters: {
  page: number;
  limit: number;
  search?: string;
  status?: string;
}) {
  const { rows, total } = await repo.findCouponsPage(filters);
  const now = new Date();

  const data = rows.map((row) => {
    const status = !row.isActive
      ? ("revoked" as const)
      : row.expiresAt < now
        ? ("expired" as const)
        : row.usedCount >= (row.maxUses ?? 1)
          ? ("used" as const)
          : ("active" as const);

    return {
      id: row.id,
      code: row.code,
      referrerName: row.referrerName,
      amount: toWholeRupees(row.value),
      status,
      issuedAt: row.createdAt.toISOString(),
      expiresAt: row.expiresAt.toISOString(),
      usedInOrderId: row.usedInOrderId,
    };
  });

  return {
    data,
    meta: {
      page: filters.page,
      limit: filters.limit,
      total,
      hasNext: filters.page * filters.limit < total,
    },
  };
}
