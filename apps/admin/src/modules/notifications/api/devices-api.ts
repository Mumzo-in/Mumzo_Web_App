import { apiRequest } from "@/core/api/client";

/**
 * Device registration against `/api/v1/admin/devices`.
 *
 * Unlike the rest of the admin modules this talks to the real endpoint
 * rather than mock data — the devices routes exist server-side, and a
 * mocked registration would defeat the point (no row, no push).
 */

export type StaffDevice = {
  id: string;
  deviceId: string;
  channel: "fcm" | "web-push";
  platform: "ios" | "android" | "web";
  isActive: boolean;
};

const DEVICE_ID_STORAGE_KEY = "mumzo-admin.device-id";

/**
 * A stable per-browser id, persisted in localStorage.
 *
 * Deliberately *not* the FCM token: tokens rotate, and keying rows on one
 * would leave a new orphan row on every refresh. The server upserts on
 * (staffUserId, deviceId), so a rotated token updates the existing row.
 */
export function getOrCreateDeviceId(): string {
  const existing = window.localStorage.getItem(DEVICE_ID_STORAGE_KEY);
  if (existing) return existing;

  const deviceId = crypto.randomUUID();
  window.localStorage.setItem(DEVICE_ID_STORAGE_KEY, deviceId);
  return deviceId;
}

/** The id of the row the server created, kept so logout can deactivate it
 * without a lookup round-trip. */
const DEVICE_ROW_STORAGE_KEY = "mumzo-admin.device-row-id";

export async function registerDevice(token: string): Promise<StaffDevice> {
  const device = await apiRequest<StaffDevice>("/devices", {
    method: "POST",
    body: {
      deviceId: getOrCreateDeviceId(),
      channel: "fcm",
      platform: "web",
      token,
    },
    // NB: staff devices are always the "admin" client, so the server sets
    // `app` itself rather than trusting a value from the browser.
  });

  window.localStorage.setItem(DEVICE_ROW_STORAGE_KEY, device.id);
  return device;
}

/**
 * Deactivates this browser's device row on logout, so a signed-out machine
 * stops receiving order pushes. Best-effort: a failure here must not block
 * the sign-out itself.
 */
export async function unregisterDevice(): Promise<void> {
  const rowId = window.localStorage.getItem(DEVICE_ROW_STORAGE_KEY);
  if (!rowId) return;

  try {
    await apiRequest(`/devices/${rowId}`, { method: "DELETE" });
  } catch (error) {
    console.error("[notifications] failed to unregister device:", error);
  } finally {
    window.localStorage.removeItem(DEVICE_ROW_STORAGE_KEY);
  }
}
