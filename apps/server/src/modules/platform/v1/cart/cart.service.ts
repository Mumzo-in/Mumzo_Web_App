import { db } from "@mumzo/db";
import { wishlist } from "@mumzo/db/schema/account";
import {
  brand,
  inventory,
  product,
  productColor,
  productSize,
} from "@mumzo/db/schema/catalog";
import { cart, cartItem } from "@mumzo/db/schema/commerce";
import { and, desc, eq, inArray, isNull, sql } from "drizzle-orm";

import { logCustomerEvent } from "@/core/customer-event";
import { badRequest, notFound, unauthorized } from "@/core/errors";
import { toWholeRupees } from "@/lib/money";
import {
  type ValidateCouponInput,
  validateCoupon,
} from "@/modules/admin/v1/coupons/coupons.service";
import {
  type CustomerLocation,
  resolveHubForLocation,
} from "@/shared/hub-resolution";
import { computeCartTotals, resolveLine } from "@/shared/pricing";

/** Exactly one of these identifies whose cart it is — never both, never
 * neither. See `cart.identity.ts` for how a request resolves to this. */
export type CartOwner =
  | { userId: string; guestSessionId: null }
  | { userId: null; guestSessionId: string };

async function findCartRow(owner: CartOwner) {
  const condition =
    owner.userId !== null
      ? eq(cart.userId, owner.userId)
      : eq(cart.guestSessionId, owner.guestSessionId);

  const [row] = await db.select().from(cart).where(condition).limit(1);
  return row ?? null;
}

async function getOrCreateCartRow(owner: CartOwner) {
  const existing = await findCartRow(owner);
  if (existing) return existing;

  const [row] = await db
    .insert(cart)
    .values({
      userId: owner.userId,
      guestSessionId: owner.guestSessionId,
    })
    .returning();

  if (!row) throw notFound("Cart");
  return row;
}

/** One row per line, joined to whatever the item actually references —
 * the product always, plus its size/color row when present. Nothing here
 * assumes a variant exists (see docs/order-checkout-flow.md §4).
 *
 * Stock is the active hub's `inventory.stock`, matched on the same variant
 * as the cart line (or the variant-less row when there's no size/color) —
 * the same number the admin Inventory panel edits. Not `productSize`/
 * `productColor.stock`, which is only ever set once at product creation and
 * never updated after. */
async function loadLines(cartId: string, location: CustomerLocation = {}) {
  const hubRow = await resolveHubForLocation(location);

  const rows = await db
    .select({
      item: cartItem,
      product,
      brandName: brand.name,
      size: productSize,
      color: productColor,
      stock: inventory.stock,
    })
    .from(cartItem)
    .innerJoin(product, eq(cartItem.productId, product.id))
    .innerJoin(brand, eq(product.brandId, brand.id))
    .leftJoin(productSize, eq(cartItem.productSizeId, productSize.id))
    .leftJoin(productColor, eq(cartItem.productColorId, productColor.id))
    .leftJoin(
      inventory,
      and(
        eq(inventory.productId, product.id),
        eq(inventory.hubId, hubRow.id),
        sql`${inventory.productSizeId} is not distinct from ${cartItem.productSizeId}`,
        sql`${inventory.productColorId} is not distinct from ${cartItem.productColorId}`,
      ),
    )
    .where(eq(cartItem.cartId, cartId))
    .orderBy(desc(cartItem.createdAt));

  return rows.map(({ item, product: p, brandName, size, color, stock }) => {
    const resolved = resolveLine(p, size, color);
    const resolvedStock = stock ?? 0;
    return {
      id: item.id,
      productId: p.id,
      productSizeId: item.productSizeId,
      productColorId: item.productColorId,
      name: p.name,
      brand: brandName,
      img: p.images[0] ?? null,
      variantLabel: size?.label ?? color?.label ?? null,
      price: resolved.price,
      mrp: p.mrp,
      qty: item.qty,
      stock: resolvedStock,
      isOutOfStock: item.qty > resolvedStock,
      selected: item.selected,
      gstRate: resolved.gstRate,
    };
  });
}

/** DB/internal math is paise throughout (see `shared/pricing.ts`); the API
 * speaks whole rupees (see `lib/money.ts`) — this is the one place a cart
 * response crosses that boundary. */
function toPublicCart(
  cartRow: { id: string; couponId: string | null },
  lines: Awaited<ReturnType<typeof loadLines>>,
  couponCode: string | null,
  discount: number,
) {
  // Only checked-off lines count toward totals/checkout — a deselected line
  // stays visible in the cart but contributes nothing to the order.
  const totals = computeCartTotals(
    lines.filter((l) => l.selected),
    discount,
  );
  return {
    id: cartRow.id,
    items: lines.map(({ gstRate: _gstRate, price, mrp, ...line }) => ({
      ...line,
      price: toWholeRupees(price),
      mrp: toWholeRupees(mrp),
    })),
    couponCode,
    totals: {
      subtotal: toWholeRupees(totals.subtotal),
      gstAmount: toWholeRupees(totals.gstAmount),
      deliveryFee: toWholeRupees(totals.deliveryFee),
      discount: toWholeRupees(totals.discount),
      total: toWholeRupees(totals.total),
      freeDeliveryThreshold: toWholeRupees(49_900),
    },
  };
}

/** Re-validates the applied coupon against current cart contents on every
 * read — a mutation elsewhere in the cart (removing the qualifying item,
 * the coupon expiring) must not leave a stale discount applied.
 *
 * Takes the coupon row (already fetched in parallel with `loadLines` by the
 * caller) rather than fetching it itself, so the two independent reads
 * aren't serialized. */
async function resolveAppliedDiscount(
  cartRow: { id: string; couponId: string | null },
  couponRow: { code: string } | null,
  lines: Awaited<ReturnType<typeof loadLines>>,
  userId: string | null,
) {
  if (!cartRow.couponId || !couponRow) return { code: null, discount: 0 };

  // A deselected line isn't part of this checkout — it shouldn't count
  // toward the coupon's minimum spend or its product-scope check.
  const selectedLines = lines.filter((l) => l.selected);
  const subtotal = selectedLines.reduce((sum, l) => sum + l.price * l.qty, 0);
  const input: ValidateCouponInput = {
    code: couponRow.code,
    cartTotal: subtotal,
    productIds: selectedLines.map((l) => l.productId),
    userId: userId ?? undefined,
  };

  try {
    const result = await validateCoupon(input);
    return { code: result.code, discount: result.discount };
  } catch {
    // Coupon no longer valid against the current cart — silently drop it
    // rather than surface a stale-discount error on a plain cart read.
    await db
      .update(cart)
      .set({ couponId: null })
      .where(eq(cart.id, cartRow.id));
    return { code: null, discount: 0 };
  }
}

/** Shared tail of every cart operation: load lines and the applied coupon
 * in parallel (they don't depend on each other), then fold into the public
 * shape. Callers that already hold `cartRow` (most mutations) should pass
 * it straight through instead of re-fetching via `getCart`. */
async function buildCartResponse(
  owner: CartOwner,
  cartRow: { id: string; couponId: string | null },
  location: CustomerLocation = {},
) {
  const [lines, couponRow] = await Promise.all([
    loadLines(cartRow.id, location),
    cartRow.couponId
      ? db.query.coupon.findFirst({
          where: (c, { eq: eqOp }) => eqOp(c.id, cartRow.couponId as string),
        })
      : Promise.resolve(null),
  ]);

  const { code, discount } = await resolveAppliedDiscount(
    cartRow,
    couponRow ?? null,
    lines,
    owner.userId,
  );
  return toPublicCart(cartRow, lines, code, discount);
}

export async function getCart(
  owner: CartOwner,
  location: CustomerLocation = {},
) {
  const cartRow = await getOrCreateCartRow(owner);
  return buildCartResponse(owner, cartRow, location);
}

export async function addItem(
  owner: CartOwner,
  input: {
    productId: string;
    productSizeId?: string | null;
    productColorId?: string | null;
    qty: number;
  },
) {
  if (input.productSizeId && input.productColorId) {
    throw badRequest("An item can't have both a size and a color variant.");
  }

  const cartRow = await getOrCreateCartRow(owner);

  const [existing] = await db
    .select({ id: cartItem.id, qty: cartItem.qty })
    .from(cartItem)
    .where(
      and(
        eq(cartItem.cartId, cartRow.id),
        eq(cartItem.productId, input.productId),
        input.productSizeId
          ? eq(cartItem.productSizeId, input.productSizeId)
          : isNull(cartItem.productSizeId),
        input.productColorId
          ? eq(cartItem.productColorId, input.productColorId)
          : isNull(cartItem.productColorId),
      ),
    )
    .limit(1);

  if (existing) {
    await db
      .update(cartItem)
      .set({ qty: existing.qty + input.qty })
      .where(eq(cartItem.id, existing.id));
  } else {
    await db.insert(cartItem).values({
      cartId: cartRow.id,
      productId: input.productId,
      productSizeId: input.productSizeId ?? null,
      productColorId: input.productColorId ?? null,
      qty: input.qty,
    });
  }

  if (owner.userId) {
    logCustomerEvent({
      userId: owner.userId,
      action: "cart.add_item",
      entityType: "product",
      entityId: input.productId,
      metadata: { productId: input.productId, qty: input.qty },
    }).catch((error) => {
      console.error("Failed to log cart.add_item event:", error);
    });
  }

  return buildCartResponse(owner, cartRow);
}

async function assertOwnedItem(owner: CartOwner, itemId: string) {
  const cartRow = await findCartRow(owner);
  if (!cartRow) throw notFound("Cart item");

  const [row] = await db
    .select({ id: cartItem.id })
    .from(cartItem)
    .where(and(eq(cartItem.id, itemId), eq(cartItem.cartId, cartRow.id)))
    .limit(1);

  if (!row) throw notFound("Cart item");
  return cartRow;
}

export async function updateItem(
  owner: CartOwner,
  itemId: string,
  patch: { qty?: number; selected?: boolean },
) {
  const cartRow = await assertOwnedItem(owner, itemId);
  if (patch.qty === undefined && patch.selected === undefined) {
    throw badRequest("Nothing to update — send qty and/or selected.");
  }
  await db.update(cartItem).set(patch).where(eq(cartItem.id, itemId));
  return buildCartResponse(owner, cartRow);
}

/** Selects/deselects every line in one statement — the "select all" header
 * checkbox sends one request instead of one PATCH per line. */
export async function setAllSelected(owner: CartOwner, selected: boolean) {
  const cartRow = await getOrCreateCartRow(owner);
  await db
    .update(cartItem)
    .set({ selected })
    .where(eq(cartItem.cartId, cartRow.id));
  return buildCartResponse(owner, cartRow);
}

export async function removeItem(owner: CartOwner, itemId: string) {
  const cartRow = await assertOwnedItem(owner, itemId);

  const [removed] = await db
    .select({ productId: cartItem.productId })
    .from(cartItem)
    .where(eq(cartItem.id, itemId))
    .limit(1);

  await db.delete(cartItem).where(eq(cartItem.id, itemId));

  if (owner.userId && removed) {
    logCustomerEvent({
      userId: owner.userId,
      action: "cart.remove_item",
      entityType: "product",
      entityId: removed.productId,
      metadata: { productId: removed.productId },
    }).catch((error) => {
      console.error("Failed to log cart.remove_item event:", error);
    });
  }

  return buildCartResponse(owner, cartRow);
}

/** Moves the given lines to the wishlist in one DB round trip: wishlists
 * each line's product, then deletes the lines — instead of the client
 * looping a wishlist-add + cart-delete call per item. Wishlist is
 * user-only, so a guest owner can't call this (the client already gates the
 * action behind sign-in). */
export async function moveItemsToWishlist(owner: CartOwner, itemIds: string[]) {
  if (!owner.userId) throw unauthorized();
  const userId = owner.userId;

  const cartRow = await getOrCreateCartRow(owner);
  if (itemIds.length === 0) return buildCartResponse(owner, cartRow);

  const lines = await db
    .select({ id: cartItem.id, productId: cartItem.productId })
    .from(cartItem)
    .where(and(eq(cartItem.cartId, cartRow.id), inArray(cartItem.id, itemIds)));

  if (lines.length === 0) return buildCartResponse(owner, cartRow);

  await db.transaction(async (tx) => {
    await tx
      .insert(wishlist)
      .values(lines.map((line) => ({ userId, productId: line.productId })))
      .onConflictDoNothing();
    await tx.delete(cartItem).where(
      inArray(
        cartItem.id,
        lines.map((line) => line.id),
      ),
    );
  });

  return buildCartResponse(owner, cartRow);
}

export async function clearCart(owner: CartOwner) {
  const cartRow = await getOrCreateCartRow(owner);
  await db.delete(cartItem).where(eq(cartItem.cartId, cartRow.id));
  await db.update(cart).set({ couponId: null }).where(eq(cart.id, cartRow.id));
  return buildCartResponse(owner, { ...cartRow, couponId: null });
}

export async function applyCoupon(owner: CartOwner, code: string) {
  const cartRow = await getOrCreateCartRow(owner);
  const lines = await loadLines(cartRow.id);
  const subtotal = lines.reduce((sum, l) => sum + l.price * l.qty, 0);

  const result = await validateCoupon({
    code,
    cartTotal: subtotal,
    productIds: lines.map((l) => l.productId),
    userId: owner.userId ?? undefined,
  });

  const couponRow = await db.query.coupon.findFirst({
    where: (c, { eq: eqOp }) => eqOp(c.code, result.code),
  });

  if (!couponRow) throw notFound("Coupon");

  await db
    .update(cart)
    .set({ couponId: couponRow.id })
    .where(eq(cart.id, cartRow.id));

  return buildCartResponse(owner, { ...cartRow, couponId: couponRow.id });
}

export async function removeCoupon(owner: CartOwner) {
  const cartRow = await getOrCreateCartRow(owner);
  await db.update(cart).set({ couponId: null }).where(eq(cart.id, cartRow.id));
  return buildCartResponse(owner, { ...cartRow, couponId: null });
}

/** Guest → user merge on login. Sums quantities for shared productSize/
 * productColor lines, keeps distinct lines as-is, per
 * docs/order-checkout-flow.md §8. A guest cart with an empty user cart is
 * just adopted wholesale (the merge loop is a no-op, then the guest cart's
 * ownership is reassigned). */
export async function mergeGuestCart(userId: string, guestSessionId: string) {
  const guestCart = await findCartRow({ userId: null, guestSessionId });
  if (!guestCart) return getCart({ userId, guestSessionId: null });

  const userCart = await getOrCreateCartRow({ userId, guestSessionId: null });

  const guestItems = await db
    .select()
    .from(cartItem)
    .where(eq(cartItem.cartId, guestCart.id));

  for (const gi of guestItems) {
    const [existing] = await db
      .select({ id: cartItem.id, qty: cartItem.qty })
      .from(cartItem)
      .where(
        and(
          eq(cartItem.cartId, userCart.id),
          eq(cartItem.productId, gi.productId),
          gi.productSizeId
            ? eq(cartItem.productSizeId, gi.productSizeId)
            : isNull(cartItem.productSizeId),
          gi.productColorId
            ? eq(cartItem.productColorId, gi.productColorId)
            : isNull(cartItem.productColorId),
        ),
      )
      .limit(1);

    if (existing) {
      await db
        .update(cartItem)
        .set({ qty: existing.qty + gi.qty })
        .where(eq(cartItem.id, existing.id));
    } else {
      await db.insert(cartItem).values({
        cartId: userCart.id,
        productId: gi.productId,
        productSizeId: gi.productSizeId,
        productColorId: gi.productColorId,
        qty: gi.qty,
      });
    }
  }

  await db.delete(cart).where(eq(cart.id, guestCart.id));

  return getCart({ userId, guestSessionId: null });
}
