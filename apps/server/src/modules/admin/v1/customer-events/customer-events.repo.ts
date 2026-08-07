import { db } from "@mumzo/db";
import { customerEvent } from "@mumzo/db/schema/account";
import { user } from "@mumzo/db/schema/auth";
import { and, desc, eq, ilike, or, type SQL, sql } from "drizzle-orm";

export async function findPage(filters: {
  page: number;
  limit: number;
  userId?: string;
  action?: string;
  search?: string;
}) {
  const offset = (filters.page - 1) * filters.limit;
  const conditions: SQL[] = [];

  if (filters.userId) {
    conditions.push(eq(customerEvent.userId, filters.userId));
  }
  if (filters.action) {
    conditions.push(eq(customerEvent.action, filters.action));
  }
  if (filters.search) {
    const clause = or(
      ilike(user.name, `%${filters.search}%`),
      ilike(user.email, `%${filters.search}%`),
      ilike(customerEvent.action, `%${filters.search}%`),
    );
    if (clause) {
      conditions.push(clause);
    }
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [rows, [countRow]] = await Promise.all([
    db
      .select({
        id: customerEvent.id,
        userId: customerEvent.userId,
        userName: user.name,
        userEmail: user.email,
        action: customerEvent.action,
        entityType: customerEvent.entityType,
        entityId: customerEvent.entityId,
        metadata: customerEvent.metadata,
        createdAt: customerEvent.createdAt,
      })
      .from(customerEvent)
      .leftJoin(user, eq(user.id, customerEvent.userId))
      .where(where)
      .orderBy(desc(customerEvent.createdAt))
      .limit(filters.limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(customerEvent)
      .leftJoin(user, eq(user.id, customerEvent.userId))
      .where(where),
  ]);

  return { rows, total: countRow?.count ?? 0 };
}
