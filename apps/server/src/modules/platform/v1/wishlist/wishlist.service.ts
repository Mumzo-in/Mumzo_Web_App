import { db } from "@mumzo/db";
import { wishlist } from "@mumzo/db/schema/account";
import { and, eq } from "drizzle-orm";

export async function listWishlistIds(userId: string): Promise<string[]> {
  const rows = await db
    .select({ productId: wishlist.productId })
    .from(wishlist)
    .where(eq(wishlist.userId, userId));
  return rows.map((r) => r.productId);
}

/** Idempotent — wishlisting an already-wishlisted product is a no-op, not
 * an error, matching the storefront's toggle-style UX. */
export async function addToWishlist(userId: string, productId: string) {
  await db.insert(wishlist).values({ userId, productId }).onConflictDoNothing();
}

export async function removeFromWishlist(userId: string, productId: string) {
  await db
    .delete(wishlist)
    .where(and(eq(wishlist.userId, userId), eq(wishlist.productId, productId)));
}
