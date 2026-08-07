import { db } from "@mumzo/db";
import { wishlist } from "@mumzo/db/schema/account";
import { and, eq } from "drizzle-orm";
import { logCustomerEvent } from "@/core/customer-event";

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
  const [inserted] = await db
    .insert(wishlist)
    .values({ userId, productId })
    .onConflictDoNothing()
    .returning({ productId: wishlist.productId });

  if (inserted) {
    logCustomerEvent({
      userId,
      action: "wishlist.add",
      entityType: "product",
      entityId: productId,
      metadata: { productId },
    }).catch((error) => {
      console.error("Failed to log wishlist.add event:", error);
    });
  }
}

export async function removeFromWishlist(userId: string, productId: string) {
  const deleted = await db
    .delete(wishlist)
    .where(and(eq(wishlist.userId, userId), eq(wishlist.productId, productId)))
    .returning({ productId: wishlist.productId });

  if (deleted.length > 0) {
    logCustomerEvent({
      userId,
      action: "wishlist.remove",
      entityType: "product",
      entityId: productId,
      metadata: { productId },
    }).catch((error) => {
      console.error("Failed to log wishlist.remove event:", error);
    });
  }
}
