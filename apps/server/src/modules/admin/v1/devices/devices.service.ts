import { db } from "@mumzo/db";
import { staffDevice } from "@mumzo/db/schema/notifications";
import { and, eq } from "drizzle-orm";

import { notFound } from "@/core/errors";

export interface RegisterStaffDeviceInput {
  deviceId: string;
  channel: "fcm" | "web-push";
  platform: "ios" | "android" | "web";
  token: string;
}

function toPublicDevice(row: typeof staffDevice.$inferSelect) {
  return {
    id: row.id,
    deviceId: row.deviceId,
    channel: row.channel as "fcm" | "web-push",
    platform: row.platform as "ios" | "android" | "web",
    isActive: row.isActive,
  };
}

/** Staff equivalent of the platform devices service — see that module's
 * docstring for the upsert-on-`(staffUserId, deviceId)` rationale (a token
 * refresh re-registers the same client-generated id, not a new device). */
export async function registerStaffDevice(
  staffUserId: string,
  input: RegisterStaffDeviceInput,
) {
  const [row] = await db
    .insert(staffDevice)
    .values({
      staffUserId,
      deviceId: input.deviceId,
      channel: input.channel,
      platform: input.platform,
      token: input.token,
      isActive: true,
      lastSeenAt: /* @__PURE__ */ new Date(),
    })
    .onConflictDoUpdate({
      target: [staffDevice.staffUserId, staffDevice.deviceId],
      set: {
        channel: input.channel,
        platform: input.platform,
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

export async function unregisterStaffDevice(staffUserId: string, id: string) {
  const [row] = await db
    .update(staffDevice)
    .set({ isActive: false })
    .where(
      and(eq(staffDevice.id, id), eq(staffDevice.staffUserId, staffUserId)),
    )
    .returning();

  if (!row) {
    throw notFound("Device");
  }
}
