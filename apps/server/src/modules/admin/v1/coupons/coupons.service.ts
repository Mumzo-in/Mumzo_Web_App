import { ERROR_CODES } from "@/core/constants";
import { badRequest, conflict, notFound } from "@/core/errors";
import { toPaise, toWholeRupees } from "@/lib/money";
import * as couponsRepo from "./coupons.repo";

/** `value`/`cap`/`minAmt` are money only when `type === "flat"`/always for
 * `cap`/`minAmt` — `value` on a `pct` coupon is a plain 1-100 percent, never
 * money, and must never cross the paise boundary. */
function toRupeeCoupon<
  T extends {
    type: CouponType;
    value: number;
    cap: number | null;
    minAmt: number;
  },
>(row: T): T {
  return {
    ...row,
    value: row.type === "flat" ? toWholeRupees(row.value) : row.value,
    cap: row.cap === null ? null : toWholeRupees(row.cap),
    minAmt: toWholeRupees(row.minAmt),
  };
}

type CouponType = "flat" | "pct";
type ProductScope = "all" | "specific";
type Visibility = "public" | "assigned";

type CouponWriteInput = {
  code: string;
  description?: string | null;
  type: CouponType;
  value: number;
  cap?: number | null;
  minAmt: number;
  categorySlug?: string | null;
  brandId?: string | null;
  productScope: ProductScope;
  productIds: string[];
  visibility: Visibility;
  assignedUserIds: string[];
  segment?: string | null;
  firstOrderOnly: boolean;
  maxUses?: number | null;
  maxUsesPerUser?: number | null;
  isStackable: boolean;
  priority: number;
  expiresAt: string;
  startsAt?: string | null;
  isActive: boolean;
  isGlobal: boolean;
};

function serialize(
  row: NonNullable<Awaited<ReturnType<typeof couponsRepo.findById>>>,
) {
  return toRupeeCoupon({
    id: row.id,
    code: row.code,
    description: row.description,
    type: row.type as CouponType,
    value: row.value,
    cap: row.cap,
    minAmt: row.minAmt,
    categorySlug: row.categorySlug,
    brandId: row.brandId,
    productScope: row.productScope as ProductScope,
    productIds: row.productIds,
    visibility: row.visibility as Visibility,
    assignedUserIds: row.assignedUserIds,
    segment: row.segment,
    firstOrderOnly: row.firstOrderOnly,
    maxUses: row.maxUses,
    maxUsesPerUser: row.maxUsesPerUser,
    usedCount: row.usedCount,
    isStackable: row.isStackable,
    priority: row.priority,
    expiresAt: row.expiresAt.toISOString(),
    startsAt: row.startsAt?.toISOString() ?? null,
    isActive: row.isActive,
    isGlobal: row.isGlobal,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  });
}

export async function listCoupons(filters: {
  page: number;
  limit: number;
  search?: string;
  isActive?: boolean;
}) {
  const { rows, total } = await couponsRepo.findPage(filters);

  return {
    data: rows.map((row) =>
      toRupeeCoupon({
        id: row.id,
        code: row.code,
        description: row.description,
        type: row.type as CouponType,
        value: row.value,
        cap: row.cap,
        minAmt: row.minAmt,
        categorySlug: row.categorySlug,
        brandId: row.brandId,
        productScope: row.productScope as ProductScope,
        productIds: [] as string[],
        visibility: row.visibility as Visibility,
        assignedUserIds: [] as string[],
        segment: row.segment,
        firstOrderOnly: row.firstOrderOnly,
        maxUses: row.maxUses,
        maxUsesPerUser: row.maxUsesPerUser,
        usedCount: row.usedCount,
        isStackable: row.isStackable,
        priority: row.priority,
        expiresAt: row.expiresAt.toISOString(),
        startsAt: row.startsAt?.toISOString() ?? null,
        isActive: row.isActive,
        isGlobal: row.isGlobal,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      }),
    ),
    meta: {
      page: filters.page,
      limit: filters.limit,
      total,
      hasNext: filters.page * filters.limit < total,
    },
  };
}

async function requireCoupon(id: string) {
  const row = await couponsRepo.findById(id);
  if (!row) {
    throw notFound("Coupon");
  }
  return row;
}

export async function getCoupon(id: string) {
  return serialize(await requireCoupon(id));
}

/**
 * Cross-field rules that depend on the *merged* record — checked here
 * rather than in the Zod schema so a PATCH that only touches `isActive`
 * doesn't have to re-satisfy "specific scope needs productIds" just
 * because that field isn't in this particular payload.
 */
function assertConsistent(merged: {
  type: CouponType;
  value: number;
  productScope: ProductScope;
  productIds: string[];
  visibility: Visibility;
  assignedUserIds: string[];
}) {
  if (merged.type === "pct" && merged.value > 100) {
    throw badRequest("A percentage coupon can't exceed 100.");
  }
  if (merged.productScope === "specific" && merged.productIds.length === 0) {
    throw badRequest(
      "Pick at least one product for a product-specific coupon.",
    );
  }
  if (merged.visibility === "assigned" && merged.assignedUserIds.length === 0) {
    throw badRequest("Assign at least one customer for an assigned coupon.");
  }
}

async function assertScopeExists(input: {
  categorySlug?: string | null;
  brandId?: string | null;
  productIds: string[];
  assignedUserIds: string[];
}) {
  if (input.categorySlug) {
    const exists = await couponsRepo.categoryExists(input.categorySlug);
    if (!exists) {
      throw notFound("Category");
    }
  }
  if (input.brandId) {
    const exists = await couponsRepo.brandExists(input.brandId);
    if (!exists) {
      throw notFound("Brand");
    }
  }
  if (input.productIds.length > 0) {
    const found = await couponsRepo.existingProductIds(input.productIds);
    if (found.length !== input.productIds.length) {
      throw notFound("Product");
    }
  }
  if (input.assignedUserIds.length > 0) {
    const found = await couponsRepo.existingUserIds(input.assignedUserIds);
    if (found.length !== input.assignedUserIds.length) {
      throw notFound("Customer");
    }
  }
}

export async function createCoupon(input: CouponWriteInput) {
  const existing = await couponsRepo.findByCode(input.code);
  if (existing) {
    throw conflict(`A coupon with code "${input.code}" already exists.`);
  }

  // Validated against the rupee value as submitted (a `pct` coupon's
  // "can't exceed 100" check would be meaningless against paise).
  assertConsistent(input);
  await assertScopeExists(input);

  const { productIds, assignedUserIds, ...rest } = input;

  return couponsRepo.insert(
    {
      ...rest,
      value: rest.type === "flat" ? toPaise(rest.value) : rest.value,
      cap: rest.cap == null ? null : toPaise(rest.cap),
      minAmt: toPaise(rest.minAmt),
      categorySlug: rest.categorySlug ?? null,
      brandId: rest.brandId ?? null,
      description: rest.description ?? null,
      segment: rest.segment ?? null,
      maxUses: rest.maxUses ?? null,
      maxUsesPerUser: rest.maxUsesPerUser ?? null,
      startsAt: rest.startsAt ? new Date(rest.startsAt) : null,
      expiresAt: new Date(rest.expiresAt),
    },
    { productIds, assignedUserIds },
  );
}

export async function updateCoupon(
  id: string,
  input: Partial<CouponWriteInput>,
) {
  const current = await requireCoupon(id);

  if (input.code && input.code !== current.code) {
    const existing = await couponsRepo.findByCode(input.code);
    if (existing && existing.id !== id) {
      throw conflict(`A coupon with code "${input.code}" already exists.`);
    }
  }

  const merged = {
    type: input.type ?? (current.type as CouponType),
    value: input.value ?? current.value,
    productScope: input.productScope ?? (current.productScope as ProductScope),
    productIds: input.productIds ?? current.productIds,
    visibility: input.visibility ?? (current.visibility as Visibility),
    assignedUserIds: input.assignedUserIds ?? current.assignedUserIds,
  };
  assertConsistent(merged);
  await assertScopeExists({
    categorySlug: input.categorySlug,
    brandId: input.brandId,
    productIds: input.productIds ?? [],
    assignedUserIds: input.assignedUserIds ?? [],
  });

  const { productIds, assignedUserIds, startsAt, expiresAt, ...rest } = input;

  // `merged.type` is the coupon's *final* type post-update — a value the
  // caller sent under a `pct` coupon must never be paise-converted, and a
  // `flat` coupon's value/cap/minAmt always are, whether just-submitted or
  // pre-existing. Note: switching `type` from pct→flat (or back) in the same
  // request *without* also sending `value` leaves the stored number
  // unconverted under its new type's meaning — the admin form always
  // submits `value` alongside a type change today, so this doesn't arise in
  // practice, but it's not enforced here.
  await couponsRepo.update(
    id,
    {
      ...rest,
      ...(rest.value !== undefined
        ? { value: merged.type === "flat" ? toPaise(rest.value) : rest.value }
        : {}),
      ...(rest.cap !== undefined
        ? { cap: rest.cap === null ? null : toPaise(rest.cap) }
        : {}),
      ...(rest.minAmt !== undefined ? { minAmt: toPaise(rest.minAmt) } : {}),
      ...(startsAt !== undefined
        ? { startsAt: startsAt ? new Date(startsAt) : null }
        : {}),
      ...(expiresAt !== undefined ? { expiresAt: new Date(expiresAt) } : {}),
    },
    productIds !== undefined || assignedUserIds !== undefined
      ? {
          productIds: productIds ?? current.productIds,
          assignedUserIds: assignedUserIds ?? current.assignedUserIds,
        }
      : undefined,
  );
}

/** api-plan §15f: `DELETE` deactivates a coupon, it does not remove it. */
export async function deleteCoupon(id: string) {
  await requireCoupon(id);
  await couponsRepo.update(id, { isActive: false });
}

export type ValidateCouponInput = {
  code: string;
  cartTotal: number;
  categorySlug?: string | null;
  brandId?: string | null;
  productIds?: string[];
  userId?: string;
};

/**
 * Ports the discount math that today only lives client-side in the
 * storefront's cart-provider. Preview-only here: `usedCount` is incremented,
 * and `maxUsesPerUser`/`firstOrderOnly` are given a final re-check, at order
 * placement (`placeOrder` in platform/v1/orders/orders.service.ts) — this
 * function only tells the caller whether the coupon *would* be accepted.
 */
export async function validateCoupon(input: ValidateCouponInput) {
  const row = await couponsRepo.findByCodeFull(input.code.toUpperCase());
  if (!row) {
    throw badRequest(
      "This coupon code doesn't exist.",
      ERROR_CODES.COUPON_INVALID,
    );
  }

  if (!row.isActive) {
    throw badRequest(
      "This coupon is no longer active.",
      ERROR_CODES.COUPON_INVALID,
    );
  }

  if (row.claimedAt === null) {
    throw badRequest(
      "Claim this reward before using it.",
      ERROR_CODES.COUPON_NOT_CLAIMED,
    );
  }

  const now = new Date();

  if (row.startsAt && row.startsAt > now) {
    throw badRequest(
      "This coupon isn't active yet.",
      ERROR_CODES.COUPON_INVALID,
    );
  }
  if (row.expiresAt < now) {
    throw badRequest("This coupon has expired.", ERROR_CODES.COUPON_EXPIRED);
  }
  if (row.maxUses !== null && row.usedCount >= row.maxUses) {
    throw badRequest("This coupon has run out.", ERROR_CODES.COUPON_EXHAUSTED);
  }
  if (row.visibility === "assigned") {
    if (!input.userId || !row.assignedUserIds.includes(input.userId)) {
      const referralMatch = await couponsRepo.findReferralByCouponId(row.id);
      if (referralMatch) {
        throw badRequest(
          `This is ${referralMatch.referrerName}'s referral reward — refer a friend to earn your own!`,
          ERROR_CODES.REFERRAL_COUPON_NOT_YOURS,
        );
      }
      throw badRequest(
        "This coupon isn't available to you.",
        ERROR_CODES.COUPON_INVALID,
      );
    }
  }
  if (row.categorySlug && row.categorySlug !== input.categorySlug) {
    throw badRequest(
      "This coupon doesn't apply to this category.",
      ERROR_CODES.COUPON_INVALID,
    );
  }
  if (row.brandId && row.brandId !== input.brandId) {
    throw badRequest(
      "This coupon doesn't apply to this brand.",
      ERROR_CODES.COUPON_INVALID,
    );
  }
  if (row.productScope === "specific") {
    const cartProductIds = input.productIds ?? [];
    const applies = row.productIds.some((id) => cartProductIds.includes(id));
    if (!applies) {
      throw badRequest(
        "This coupon doesn't apply to any item in your cart.",
        ERROR_CODES.COUPON_INVALID,
      );
    }
  }
  if (input.cartTotal < row.minAmt) {
    const shortfall = toWholeRupees(row.minAmt - input.cartTotal);
    throw badRequest(
      `Add ₹${shortfall.toLocaleString("en-IN")} more to use this coupon.`,
      ERROR_CODES.COUPON_MIN_AMOUNT,
    );
  }
  if (input.userId) {
    const [priorOrders, priorUses] = await Promise.all([
      row.firstOrderOnly
        ? couponsRepo.countUserOrders(input.userId)
        : Promise.resolve(0),
      row.maxUsesPerUser !== null
        ? couponsRepo.countUserOrdersWithCoupon(input.userId, row.id)
        : Promise.resolve(0),
    ]);
    if (row.firstOrderOnly && priorOrders > 0) {
      throw badRequest(
        "This coupon is only valid on your first order.",
        ERROR_CODES.COUPON_FIRST_ORDER_ONLY,
      );
    }
    if (row.maxUsesPerUser !== null && priorUses >= row.maxUsesPerUser) {
      throw badRequest(
        "You've already used this coupon.",
        ERROR_CODES.COUPON_ALREADY_USED_BY_YOU,
      );
    }
  }

  const discount =
    row.type === "flat"
      ? row.value
      : Math.min(
          Math.round((input.cartTotal * row.value) / 100),
          row.cap ?? Number.POSITIVE_INFINITY,
        );

  return {
    valid: true as const,
    couponId: row.id,
    code: row.code,
    discount,
    finalTotal: input.cartTotal - discount,
    maxUsesPerUser: row.maxUsesPerUser,
  };
}

export async function getCouponUsage(id: string) {
  await requireCoupon(id);
  const rows = await couponsRepo.findCouponUsage(id);
  return rows.map((row) => ({
    orderId: row.orderId,
    placedAt: row.placedAt.toISOString(),
    total: toWholeRupees(row.total),
    discount: toWholeRupees(row.discount),
    status: row.status,
    user: {
      id: row.userId,
      name: row.userName,
      email: row.userEmail,
      phone: row.userPhone,
    },
  }));
}
