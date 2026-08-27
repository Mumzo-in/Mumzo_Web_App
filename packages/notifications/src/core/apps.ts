/**
 * Which client an FCM token belongs to.
 *
 * Today all three share one Firebase project and one service account, so
 * the value is carried but never branched on. It exists now so that
 * splitting them later — a separate Firebase project for the mobile app, a
 * separate WhatsApp number for admin — is a change to
 * `resolveCredential()` and a config table, not a schema migration plus a
 * backfill of every historical device and log row.
 *
 * Recording it from day one is the cheap half; retrofitting it onto rows
 * that never had it is the expensive half.
 */
export const NOTIFICATION_APPS = ["admin", "platform", "mobile"] as const;

export type NotificationApp = (typeof NOTIFICATION_APPS)[number];

/** Default for rows written before the column existed, and for callers
 * that genuinely don't care which client they're addressing. */
export const DEFAULT_NOTIFICATION_APP: NotificationApp = "platform";

export function isNotificationApp(value: string): value is NotificationApp {
  return (NOTIFICATION_APPS as readonly string[]).includes(value);
}

/** Narrows an arbitrary stored value, falling back rather than throwing —
 * a device row with an unrecognised `app` should still receive its
 * notification, not fail the job. */
export function toNotificationApp(value: string | null): NotificationApp {
  if (value && isNotificationApp(value)) {
    return value;
  }
  return DEFAULT_NOTIFICATION_APP;
}
