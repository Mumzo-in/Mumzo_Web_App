import { db } from "@mumzo/db";
import { staffActivityLog, staffUser } from "@mumzo/db/schema/staff";
import { and, count, desc, eq, ilike, or } from "drizzle-orm";

export type ListActivityLogsFilters = {
  page: number;
  limit: number;
  staffUserId?: string;
  entityType?: string;
  action?: string;
  search?: string;
};

/**
 * Retrieve, search, and page staff activity logs.
 */
export async function listActivityLogs(filters: ListActivityLogsFilters) {
  const offset = (filters.page - 1) * filters.limit;
  const conditions = [];

  if (filters.staffUserId) {
    conditions.push(eq(staffActivityLog.staffUserId, filters.staffUserId));
  }
  if (filters.entityType) {
    conditions.push(eq(staffActivityLog.entityType, filters.entityType));
  }
  if (filters.action) {
    conditions.push(eq(staffActivityLog.action, filters.action));
  }
  if (filters.search) {
    conditions.push(
      or(
        ilike(staffActivityLog.description, `%${filters.search}%`),
        ilike(staffActivityLog.action, `%${filters.search}%`),
        ilike(staffActivityLog.entityType, `%${filters.search}%`),
      ),
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [rows, [countRow]] = await Promise.all([
    db
      .select({
        id: staffActivityLog.id,
        staffUserId: staffActivityLog.staffUserId,
        staffUserName: staffUser.name,
        action: staffActivityLog.action,
        entityType: staffActivityLog.entityType,
        entityId: staffActivityLog.entityId,
        description: staffActivityLog.description,
        previousValues: staffActivityLog.previousValues,
        newValues: staffActivityLog.newValues,
        ipAddress: staffActivityLog.ipAddress,
        userAgent: staffActivityLog.userAgent,
        createdAt: staffActivityLog.createdAt,
      })
      .from(staffActivityLog)
      .leftJoin(staffUser, eq(staffUser.id, staffActivityLog.staffUserId))
      .where(whereClause)
      .orderBy(desc(staffActivityLog.createdAt))
      .limit(filters.limit)
      .offset(offset),
    db.select({ total: count() }).from(staffActivityLog).where(whereClause),
  ]);

  const total = countRow?.total ?? 0;

  return {
    data: rows.map((row) => ({
      ...row,
      createdAt: row.createdAt.toISOString(),
    })),
    meta: {
      page: filters.page,
      limit: filters.limit,
      total,
      hasNext: filters.page * filters.limit < total,
    },
  };
}
