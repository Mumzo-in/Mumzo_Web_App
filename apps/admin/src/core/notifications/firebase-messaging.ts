import { env } from "@mumzo/env/web";
import { type FirebaseApp, getApps, initializeApp } from "firebase/app";
import {
  getMessaging,
  getToken,
  isSupported,
  type MessagePayload,
  type Messaging,
  onMessage,
} from "firebase/messaging";

/**
 * FCM registration for the admin dashboard.
 *
 * Everything here is best-effort and non-throwing: push is an enhancement
 * over the in-app realtime feed, so a browser without support, a denied
 * permission, or a missing config must degrade quietly rather than break
 * the dashboard.
 */

const FIREBASE_CONFIG = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
};

/** Push needs the whole config plus the VAPID key — a partial config
 * produces confusing runtime errors deep inside the SDK instead of an
 * obvious "not configured". */
export function isPushConfigured(): boolean {
  return (
    Object.values(FIREBASE_CONFIG).every(Boolean) &&
    Boolean(env.VITE_FIREBASE_VAPID_KEY)
  );
}

let app: FirebaseApp | undefined;
let messagingInstance: Messaging | undefined;

function getFirebaseApp(): FirebaseApp {
  if (app) return app;
  app = getApps()[0] ?? initializeApp(FIREBASE_CONFIG);
  return app;
}

/**
 * Resolves to null wherever FCM can't run — Safari without the right
 * flags, a non-secure origin, a browser with no Push API. `isSupported()`
 * is the SDK's own check and covers more cases than feature-sniffing
 * `"Notification" in window`.
 */
async function getMessagingInstance(): Promise<Messaging | null> {
  if (!isPushConfigured()) return null;
  if (messagingInstance) return messagingInstance;
  if (!(await isSupported())) return null;

  messagingInstance = getMessaging(getFirebaseApp());
  return messagingInstance;
}

/**
 * Registers the FCM service worker explicitly rather than letting the SDK
 * find it. The SDK's implicit lookup races with any other registration on
 * the page, and being explicit means a failure surfaces here instead of as
 * a silent no-token.
 */
async function registerServiceWorker(): Promise<
  ServiceWorkerRegistration | undefined
> {
  if (!("serviceWorker" in navigator)) return undefined;

  // The worker is served straight from `public/` and never sees Vite's env
  // substitution, so its Firebase config travels in the query string. A
  // hardcoded copy inside the file drifts from `.env` silently: the worker
  // then initialises a different Firebase app and receives nothing, with no
  // error anywhere to explain why.
  //
  // The URL is also the worker's cache key, so changing config here
  // installs a fresh worker rather than leaving a stale one running.
  const query = new URLSearchParams({
    apiKey: env.VITE_FIREBASE_API_KEY ?? "",
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN ?? "",
    projectId: env.VITE_FIREBASE_PROJECT_ID ?? "",
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET ?? "",
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? "",
    appId: env.VITE_FIREBASE_APP_ID ?? "",
  });

  return navigator.serviceWorker.register(
    `/firebase-messaging-sw.js?${query.toString()}`,
    { scope: "/" },
  );
}

/**
 * Requests notification permission and returns an FCM token, or null if
 * the user declined or the browser can't do push.
 *
 * Must be called from a user gesture — browsers reject
 * `Notification.requestPermission()` outside one.
 */
export async function acquireFcmToken(): Promise<string | null> {
  const messaging = await getMessagingInstance();
  if (!messaging) {
    console.warn(
      isPushConfigured()
        ? "[fcm] cannot acquire token — messaging unsupported here"
        : "[fcm] cannot acquire token — Firebase config incomplete",
    );
    return null;
  }

  const permission = await Notification.requestPermission();
  console.info(`[fcm] notification permission: ${permission}`);
  if (permission !== "granted") return null;

  try {
    const registration = await registerServiceWorker();
    console.info(
      `[fcm] service worker registered, scope: ${registration?.scope ?? "(none)"}`,
    );

    const token = await getToken(messaging, {
      vapidKey: env.VITE_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: registration,
    });

    console.info(
      token
        ? `[fcm] token acquired: ${token.slice(0, 16)}…`
        : "[fcm] getToken returned empty — no token issued",
    );
    return token;
  } catch (error) {
    console.error("[fcm] failed to acquire token:", error);
    return null;
  }
}

/**
 * Returns a token only if permission was already granted — never prompts.
 * This is the app-boot path: a staff member who granted permission last
 * shift should be re-registered silently on the next load, since FCM
 * tokens rotate and a stale one stops delivering.
 */
export async function getExistingFcmToken(): Promise<string | null> {
  if (typeof Notification === "undefined") return null;
  if (Notification.permission !== "granted") return null;

  const messaging = await getMessagingInstance();
  if (!messaging) return null;

  try {
    const registration = await registerServiceWorker();

    return await getToken(messaging, {
      vapidKey: env.VITE_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: registration,
    });
  } catch (error) {
    console.error("[notifications] failed to refresh FCM token:", error);
    return null;
  }
}

/**
 * Subscribes to messages that arrive while a tab is focused. Background
 * messages are handled by the service worker instead — the two paths are
 * mutually exclusive, which is what keeps a single notification from being
 * shown twice.
 */
export async function onForegroundMessage(
  handler: (payload: MessagePayload) => void,
): Promise<() => void> {
  // Two sources, because neither alone is sufficient. `onMessage` fires
  // only while the tab is focused; the service worker relays everything
  // that arrived while it wasn't. A message that reaches both is deduped
  // downstream by its notification id.
  const unsubscribers: (() => void)[] = [];

  if ("serviceWorker" in navigator) {
    const relay = (event: MessageEvent) => {
      if (event.data?.type === "mumzo:notification" && event.data.payload) {
        logMessage("service-worker relay", event.data.payload);
        handler(event.data.payload as MessagePayload);
      }
    };
    navigator.serviceWorker.addEventListener("message", relay);
    unsubscribers.push(() =>
      navigator.serviceWorker.removeEventListener("message", relay),
    );
    console.info("[fcm] listening for service-worker relays (background)");
  } else {
    console.warn(
      "[fcm] no serviceWorker support — background messages cannot be relayed",
    );
  }

  const messaging = await getMessagingInstance();
  if (messaging) {
    unsubscribers.push(
      onMessage(messaging, (payload) => {
        logMessage("onMessage (tab focused)", payload);
        handler(payload);
      }),
    );
    console.info("[fcm] listening for foreground messages");
  } else {
    // The single most common reason nothing arrives: config missing, or a
    // browser/context FCM cannot run in. Say which, rather than staying
    // silent and looking like a delivery failure.
    console.warn(
      isPushConfigured()
        ? "[fcm] messaging unsupported in this browser/context — foreground messages will NOT arrive"
        : "[fcm] Firebase config incomplete (VITE_FIREBASE_*) — push is disabled",
    );
  }

  return () => {
    for (const unsubscribe of unsubscribers) unsubscribe();
  };
}

/** One grouped line per received message, naming which path delivered it —
 * the two arrive through different mechanisms, and knowing which one fired
 * is most of the diagnosis when a notification doesn't show up. */
function logMessage(source: string, payload: MessagePayload) {
  const data = payload.data ?? {};
  console.groupCollapsed(
    `[fcm] ← ${data.templateId ?? "(no templateId)"} via ${source}`,
  );
  console.log("title:", payload.notification?.title);
  console.log("body :", payload.notification?.body);
  console.log("data :", data);
  if (!data.templateId) {
    console.warn(
      "no data.templateId — the notification tray keys off this and will ignore the message",
    );
  }
  console.groupEnd();
}
