import { db } from "@mumzo/db";
import { user } from "@mumzo/db/schema/auth";
import { brand, category, product } from "@mumzo/db/schema/catalog";
import { order } from "@mumzo/db/schema/commerce";
import {
  coupon,
  couponAssignment,
  couponProduct,
} from "@mumzo/db/schema/marketing";
import { referral } from "@mumzo/db/schema/referrals";
import { and, count, desc, eq, ilike, inArray, ne, or, sql } from "drizzle-orm";

/** Pure data access — no business rules. `service.ts` owns those. */

export async function findPage(filters: {
  page: number;
  limit: number;
  search?: string;
  isActive?: boolean;
}) {
  const conditions = [
    filters.search ? ilike(coupon.code, `%${filters.search}%`) : undefined,
    filters.isActive !== undefined
      ? eq(coupon.isActive, filters.isActive)
      : undefined,
  ].filter((c) => c !== undefined);

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [rows, countRows] = await Promise.all([
    db
      .select({
        id: coupon.id,
        code: coupon.code,
        description: coupon.description,
        type: coupon.type,
        value: coupon.value,
        cap: coupon.cap,
        minAmt: coupon.minAmt,
        categorySlug: coupon.categorySlug,
        brandId: coupon.brandId,
        productScope: coupon.productScope,
        visibility: coupon.visibility,
        segment: coupon.segment,
        firstOrderOnly: coupon.firstOrderOnly,
        maxUses: coupon.maxUses,
        maxUsesPerUser: coupon.maxUsesPerUser,
        usedCount: sql<number>`count(${order.id})::int`,
        isStackable: coupon.isStackable,
        priority: coupon.priority,
        expiresAt: coupon.expiresAt,
        startsAt: coupon.startsAt,
        isActive: coupon.isActive,
        isGlobal: coupon.isGlobal,
        createdAt: coupon.createdAt,
        updatedAt: coupon.updatedAt,
      })
      .from(coupon)
      .leftJoin(order, eq(coupon.id, order.couponId))
      .where(where)
      .groupBy(coupon.id)
      .orderBy(coupon.createdAt)
      .limit(filters.limit)
      .offset((filters.page - 1) * filters.limit),
    db.select({ total: count() }).from(coupon).where(where),
  ]);

  return { rows, total: countRows[0]?.total ?? 0 };
}

const couponRowSelection = {
  id: coupon.id,
  code: coupon.code,
  description: coupon.description,
  type: coupon.type,
  value: coupon.value,
  cap: coupon.cap,
  minAmt: coupon.minAmt,
  categorySlug: coupon.categorySlug,
  brandId: coupon.brandId,
  productScope: coupon.productScope,
  visibility: coupon.visibility,
  segment: coupon.segment,
  firstOrderOnly: coupon.firstOrderOnly,
  maxUses: coupon.maxUses,
  maxUsesPerUser: coupon.maxUsesPerUser,
  usedCount: sql<number>`count(${order.id})::int`,
  isStackable: coupon.isStackable,
  priority: coupon.priority,
  expiresAt: coupon.expiresAt,
  startsAt: coupon.startsAt,
  isActive: coupon.isActive,
  isGlobal: coupon.isGlobal,
  createdAt: coupon.createdAt,
  updatedAt: coupon.updatedAt,
};

type MinimalCouponRow = {
  id: string;
  productScope: string;
  visibility: string;
};

async function withProductsAndAssignments<T extends MinimalCouponRow>(row: T) {
  const [products, assignments] = await Promise.all([
    row.productScope === "specific"
      ? db
          .select({ productId: couponProduct.productId })
          .from(couponProduct)
          .where(eq(couponProduct.couponId, row.id))
      : Promise.resolve([]),
    row.visibility === "assigned"
      ? db
          .select({ userId: couponAssignment.userId })
          .from(couponAssignment)
          .where(eq(couponAssignment.couponId, row.id))
      : Promise.resolve([]),
  ]);

  return {
    ...row,
    productIds: products.map((p) => p.productId),
    assignedUserIds: assignments.map((a) => a.userId),
  };
}

export async function findById(id: string) {
  const [row] = await db
    .select(couponRowSelection)
    .from(coupon)
    .leftJoin(order, eq(coupon.id, order.couponId))
    .where(eq(coupon.id, id))
    .groupBy(coupon.id)
    .limit(1);

  if (!row) {
    return undefined;
  }

  return withProductsAndAssignments(row);
}

/** Full coupon row by code in one query — used by `validateCoupon`, which
 * only has the code the user typed, so it can skip the extra code->id hop
 * `findByCode` + `findById` would otherwise cost. */
export async function findByCodeFull(code: string) {
  const [row] = await db
    .select(couponRowSelection)
    .from(coupon)
    .leftJoin(order, eq(coupon.id, order.couponId))
    .where(eq(coupon.code, code))
    .groupBy(coupon.id)
    .limit(1);

  if (!row) {
    return undefined;
  }

  return withProductsAndAssignments(row);
}

export async function findByCode(code: string) {
  const [row] = await db
    .select({ id: coupon.id })
    .from(coupon)
    .where(eq(coupon.code, code))
    .limit(1);
  return row;
}

export async function categoryExists(slug: string) {
  const [row] = await db
    .select({ slug: category.slug })
    .from(category)
    .where(eq(category.slug, slug))
    .limit(1);
  return Boolean(row);
}

export async function brandExists(brandId: string) {
  const [row] = await db
    .select({ id: brand.id })
    .from(brand)
    .where(eq(brand.id, brandId))
    .limit(1);
  return Boolean(row);
}

/** Returns the subset of `productIds` that actually exist. */
export async function existingProductIds(productIds: string[]) {
  if (productIds.length === 0) {
    return [];
  }
  const rows = await db
    .select({ id: product.id })
    .from(product)
    .where(inArray(product.id, productIds));
  return rows.map((r) => r.id);
}

/** Returns the subset of `userIds` that actually exist. */
export async function existingUserIds(userIds: string[]) {
  if (userIds.length === 0) {
    return [];
  }
  const rows = await db
    .select({ id: user.id })
    .from(user)
    .where(inArray(user.id, userIds));
  return rows.map((r) => r.id);
}

type CouponRow = typeof coupon.$inferInsert;

export async function insert(
  values: Omit<CouponRow, "id" | "usedCount" | "createdAt" | "updatedAt">,
  scope: { productIds: string[]; assignedUserIds: string[] },
) {
  return db.transaction(async (tx) => {
    const [row] = await tx
      .insert(coupon)
      .values(values)
      .returning({ id: coupon.id });

    if (!row) {
      throw new Error("Insert into coupon returned no row.");
    }

    if (scope.productIds.length > 0) {
      await tx.insert(couponProduct).values(
        scope.productIds.map((productId) => ({
          couponId: row.id,
          productId,
        })),
      );
    }

    if (scope.assignedUserIds.length > 0) {
      await tx
        .insert(couponAssignment)
        .values(
          scope.assignedUserIds.map((userId) => ({ couponId: row.id, userId })),
        );
    }

    return row.id;
  });
}

export async function update(
  id: string,
  values: Partial<
    Omit<CouponRow, "id" | "usedCount" | "createdAt" | "updatedAt">
  >,
  scope?: { productIds: string[]; assignedUserIds: string[] },
) {
  await db.transaction(async (tx) => {
    if (Object.keys(values).length > 0) {
      await tx.update(coupon).set(values).where(eq(coupon.id, id));
    }

    if (scope) {
      await tx.delete(couponProduct).where(eq(couponProduct.couponId, id));
      if (scope.productIds.length > 0) {
        await tx
          .insert(couponProduct)
          .values(
            scope.productIds.map((productId) => ({ couponId: id, productId })),
          );
      }

      await tx
        .delete(couponAssignment)
        .where(eq(couponAssignment.couponId, id));
      if (scope.assignedUserIds.length > 0) {
        await tx
          .insert(couponAssignment)
          .values(
            scope.assignedUserIds.map((userId) => ({ couponId: id, userId })),
          );
      }
    }
  });
}

export async function remove(id: string) {
  await db.delete(coupon).where(eq(coupon.id, id));
}

/**
 * Is this coupon referral-issued, and if so who's the referrer? Checks both
 * `referral.couponId` (referrer tier coupons) and `referral.refereeCouponId`
 * (referee welcome coupons) — the discriminator `validateCoupon` uses to
 * give a referral-aware "this isn't your coupon" message instead of the
 * generic assigned-coupon rejection.
 */
export async function findReferralByCouponId(couponId: string) {
  const [row] = await db
    .select({
      referrerUserId: referral.referrerUserId,
      referrerName: user.name,
    })
    .from(referral)
    .innerJoin(user, eq(referral.referrerUserId, user.id))
    .where(
      or(
        eq(referral.couponId, couponId),
        eq(referral.refereeCouponId, couponId),
      ),
    )
    .limit(1);
  return row ?? null;
}

/** Count of this user's non-cancelled orders — used for `firstOrderOnly`. */
export async function countUserOrders(userId: string) {
  const [row] = await db
    .select({ value: count() })
    .from(order)
    .where(and(eq(order.userId, userId), ne(order.status, "cancelled")));
  return row?.value ?? 0;
}

/** Count of this user's non-cancelled orders that used this coupon — used
 * for `maxUsesPerUser`. */
export async function countUserOrdersWithCoupon(
  userId: string,
  couponId: string,
) {
  const [row] = await db
    .select({ value: count() })
    .from(order)
    .where(
      and(
        eq(order.userId, userId),
        eq(order.couponId, couponId),
        ne(order.status, "cancelled"),
      ),
    );
  return row?.value ?? 0;
}

export async function findCouponUsage(couponId: string) {
  return db
    .select({
      orderId: order.id,
      placedAt: order.placedAt,
      total: order.total,
      discount: order.discount,
      status: order.status,
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      userPhone: user.phoneNumber,
    })
    .from(order)
    .innerJoin(user, eq(order.userId, user.id))
    .where(eq(order.couponId, couponId))
    .orderBy(desc(order.placedAt));
}
