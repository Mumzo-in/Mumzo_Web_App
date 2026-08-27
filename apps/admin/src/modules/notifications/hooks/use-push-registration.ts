import { useCallback, useEffect, useState } from "react";

import {
  acquireFcmToken,
  getExistingFcmToken,
  isPushConfigured,
} from "@/core/notifications";
import { registerDevice } from "../api/devices-api";

/**
 * Keeps this browser's FCM registration current.
 *
 * Two entry points, because the browser only allows one of them to prompt:
 *  - `enable()` runs from a click and may request permission.
 *  - the boot effect re-registers silently when permission already exists,
 *    which matters because FCM tokens rotate — a token from last week may
 *    no longer deliver, and nothing tells the client that happened.
 */
export function usePushRegistration() {
  const [permission, setPermission] = useState<NotificationPermission | null>(
    null,
  );
  const [isRegistering, setIsRegistering] = useState(false);

  useEffect(() => {
    if (typeof Notification === "undefined") {
      setPermission("denied");
      return;
    }
    setPermission(Notification.permission);
  }, []);

  // Silent re-registration on load. Failures are logged, never surfaced:
  // push is an enhancement over the in-app realtime feed, and a staff
  // member mid-shift shouldn't see an error toast about it.
  useEffect(() => {
    if (!isPushConfigured()) return;

    let cancelled = false;

    getExistingFcmToken()
      .then((token) => {
        if (!token || cancelled) return;
        return registerDevice(token);
      })
      .catch((error) => {
        console.error("[notifications] silent re-registration failed:", error);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  /** Prompts for permission and registers. Must be called from a user
   * gesture or the browser rejects the permission request outright. */
  const enable = useCallback(async () => {
    if (!isPushConfigured()) return false;

    setIsRegistering(true);
    try {
      const token = await acquireFcmToken();
      setPermission(
        typeof Notification === "undefined"
          ? "denied"
          : Notification.permission,
      );

      if (!token) return false;

      await registerDevice(token);
      return true;
    } catch (error) {
      console.error("[notifications] push registration failed:", error);
      return false;
    } finally {
      setIsRegistering(false);
    }
  }, []);

  return {
    permission,
    isRegistering,
    isConfigured: isPushConfigured(),
    enable,
  };
}
