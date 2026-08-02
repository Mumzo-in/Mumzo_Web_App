/**
 * Shows an OS-level notification via the browser `Notification` API — the
 * complement to `core/sound`'s chime, for when the tab is backgrounded and
 * a staff member wouldn't see an in-page toast. No-ops silently if the API
 * is unsupported or permission was never granted; the permission card
 * (`modules/notifications/components/notification-permission-card`) is the
 * only place that requests it.
 */
export function showBrowserNotification(title: string, body: string) {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return;
  }

  if (Notification.permission !== "granted") {
    return;
  }

  // Only worth an OS popup when the staff member isn't already looking at
  // the tab — otherwise the in-page toast covers it.
  if (document.visibilityState === "visible") {
    return;
  }

  new Notification(title, { body, icon: "/logo.png" });
}
