import { db } from "@mumzo/db";
import { staffActivityLog } from "@mumzo/db/schema/staff";
import type { Context } from "hono";
import type { AppEnv } from "./types";

export type LogActivityParams = {
  c: Context<AppEnv>;
  action: string;
  entityType: string;
  entityId?: string | null;
  description: string;
  previousValues?: unknown | null;
  newValues?: unknown | null;
  tx?: unknown; // Drizzle transaction instance
};

/**
 * Log a staff administrative action to the audit trails database.
 */
export async function logActivity(params: LogActivityParams) {
  const {
    c,
    action,
    entityType,
    entityId,
    description,
    previousValues,
    newValues,
    tx,
  } = params;

  const user = c.get("user");
  if (!user) {
    return; // Only log activities for authenticated staff
  }

  // Parse IP address, handling proxy headers
  const rawIp = c.req.header("x-forwarded-for") || c.req.header("x-real-ip");
  const ipAddress = rawIp ? (rawIp.split(",")[0] || "").trim() || null : null;
  const userAgent = c.req.header("user-agent") || null;

  const database = (tx as typeof db) || db;

  await database.insert(staffActivityLog).values({
    staffUserId: user.id,
    action,
    entityType,
    entityId: entityId || null,
    description,
    previousValues: previousValues || null,
    newValues: newValues || null,
    ipAddress,
    userAgent,
  });

  c.set("loggedActivity", true);
}
