import { db } from "@mumzo/db";
import { user } from "@mumzo/db/schema/auth";
import { userDevice } from "@mumzo/db/schema/notifications";
import { and, eq } from "drizzle-orm";

import { notFound } from "@/core/errors";

export interface RegisterDeviceInput {
  deviceId: string;
  channel: "fcm" | "web-push";
  platform: "ios" | "android" | "web";
  /** Which client registered this token — see the schema for why. */
  app: "platform" | "mobile";
  token: string;
}

function toPublicDevice(row: typeof userDevice.$inferSelect) {
  return {
    id: row.id,
    deviceId: row.deviceId,
    channel: row.channel as "fcm" | "web-push",
    platform: row.platform as "ios" | "android" | "web",
    isActive: row.isActive,
  };
}

/**
 * Registration only happens post-login (there is no anonymous FCM/web-push
 * init) — `phone` is snapshotted from `user.phoneNumber` at call time rather
 * than joined at send time, so a device row stays self-describing even if
 * the phone number later changes.
 *
 * Upserts on `(userId, deviceId)`: a token refresh re-registers the same
 * client-generated `deviceId`, which should update the existing row, not
 * create a duplicate device.
 */
export async function registerDevice(
  userId: string,
  input: RegisterDeviceInput,
) {
  const [authUser] = await db
    .select({ phoneNumber: user.phoneNumber })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  const [row] = await db
    .insert(userDevice)
    .values({
      userId,
      phone: authUser?.phoneNumber ?? null,
      deviceId: input.deviceId,
      channel: input.channel,
      platform: input.platform,
      app: input.app,
      token: input.token,
      isActive: true,
      lastSeenAt: /* @__PURE__ */ new Date(),
    })
    .onConflictDoUpdate({
      target: [userDevice.userId, userDevice.deviceId],
      set: {
        phone: authUser?.phoneNumber ?? null,
        channel: input.channel,
        platform: input.platform,
        app: input.app,
        token: input.token,
        isActive: true,
        lastSeenAt: /* @__PURE__ */ new Date(),
      },
    })
    .returning();

  if (!row) {
    throw notFound("Device");
  }

  return toPublicDevice(row);
}

/** Logout — deactivates rather than deletes, so `notification_log` rows
 * (and the row itself, for support lookups) stay intact. */
export async function unregisterDevice(userId: string, id: string) {
  const [row] = await db
    .update(userDevice)
    .set({ isActive: false })
    .where(and(eq(userDevice.id, id), eq(userDevice.userId, userId)))
    .returning();

  if (!row) {
    throw notFound("Device");
  }
}
