import { db } from "@mumzo/db";
import { customerEvent } from "@mumzo/db/schema/account";

export type LogCustomerEventParams = {
  userId: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: unknown | null;
  tx?: unknown; // Drizzle transaction instance
};

/**
 * Log a customer-facing action (cart/wishlist/order) for the admin activity
 * timeline. Unlike `logActivity`, callers here are plain `userId`-based
 * services with no Hono `Context` in scope, so this takes raw fields
 * instead of pulling actor/IP off a request.
 */
export async function logCustomerEvent(params: LogCustomerEventParams) {
  const { userId, action, entityType, entityId, metadata, tx } = params;

  const database = (tx as typeof db) || db;

  await database.insert(customerEvent).values({
    userId,
    action,
    entityType,
    entityId: entityId || null,
    metadata: metadata ?? null,
  });
}
