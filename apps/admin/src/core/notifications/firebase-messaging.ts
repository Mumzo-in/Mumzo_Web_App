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

  return navigator.serviceWorker.register("/firebase-messaging-sw.js", {
    scope: "/",
  });
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
  if (!messaging) return null;

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return null;

  try {
    const registration = await registerServiceWorker();

    return await getToken(messaging, {
      vapidKey: env.VITE_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: registration,
    });
  } catch (error) {
    console.error("[notifications] failed to acquire FCM token:", error);
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
  const messaging = await getMessagingInstance();
  if (!messaging) return () => undefined;

  return onMessage(messaging, handler);
}
