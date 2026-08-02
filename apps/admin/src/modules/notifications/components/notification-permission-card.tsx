import { Alert } from "@mumzo/ui/components/alert";
import { Button } from "@mumzo/ui/components/button";
import { BellRing } from "lucide-react";
import { useEffect, useState } from "react";
import { unlockAudio } from "@/core/sound";

const DISMISSED_STORAGE_KEY = "mumzo-admin.notif-permission-dismissed";

function hasNotificationApi(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

/**
 * Both the chime and the browser's OS-level notification popup require a
 * real user gesture first — a fresh tab has neither, so a new order can
 * silently go unheard/unseen for an entire shift. Shown once per browser
 * (dismissal persisted in localStorage, mirrors `use-nav-panel.tsx`'s
 * pattern) until the staff member either grants both or dismisses it.
 */
export function NotificationPermissionCard() {
  const [dismissed, setDismissed] = useState(true);
  const [permission, setPermission] = useState<NotificationPermission | null>(
    null,
  );

  useEffect(() => {
    setDismissed(window.localStorage.getItem(DISMISSED_STORAGE_KEY) === "true");
    setPermission(hasNotificationApi() ? Notification.permission : "denied");
  }, []);

  if (dismissed || permission === "granted") {
    return null;
  }

  function dismiss() {
    window.localStorage.setItem(DISMISSED_STORAGE_KEY, "true");
    setDismissed(true);
  }

  async function enable() {
    unlockAudio();

    if (hasNotificationApi() && Notification.permission === "default") {
      const result = await Notification.requestPermission();
      setPermission(result);
    }

    dismiss();
  }

  return (
    <Alert
      data-testid="notification-permission-card"
      className="flex items-center justify-between gap-3"
    >
      <div className="flex items-center gap-2">
        <BellRing className="size-4 shrink-0 text-current" />
        <p className="text-foreground">
          Turn on order alerts — sound and desktop notifications so you never
          miss a new order.
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Button variant="ghost" size="sm" onClick={dismiss}>
          Not now
        </Button>
        <Button
          size="sm"
          onClick={enable}
          data-testid="notification-permission-enable"
        >
          Enable
        </Button>
      </div>
    </Alert>
  );
}
