/*
 * FCM background message handler.
 *
 * Must live at the origin root under exactly this filename — the Firebase
 * SDK registers `/firebase-messaging-sw.js` by convention, and a service
 * worker can only control pages at or below its own path.
 *
 * Plain JS loaded via importScripts (not a bundled module): a service
 * worker registered at the root scope is fetched by the browser directly,
 * so it cannot use bare module specifiers the way app code does.
 *
 * Config is inlined rather than read from import.meta.env because this file
 * is served verbatim from `public/` and never passes through Vite's
 * transform. These values are public client config — the same ones Firebase
 * embeds in any web bundle — not secrets.
 */

importScripts(
  "https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js",
);
importScripts(
  "https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js",
);

firebase.initializeApp({
  apiKey: "AIzaSyBuORouryjvIqCVOhcJyCoAsSVJWSCJcNA",
  authDomain: "mumzo-dev.firebaseapp.com",
  projectId: "mumzo-dev",
  storageBucket: "mumzo-dev.firebasestorage.app",
  messagingSenderId: "1072118091491",
  appId: "1:1072118091491:web:d10e35db43a3cf7d17bfa1",
});

const messaging = firebase.messaging();

/*
 * Fires only when no admin tab has focus — a focused tab gets `onMessage`
 * in the app instead, which shows the in-app toast. The two must not both
 * fire for one notification, hence the split.
 */
messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title ?? "Mumzo";
  const body = payload.notification?.body ?? "";
  const deeplink = payload.data?.deeplink || "/";

  self.registration.showNotification(title, {
    body,
    icon: "/logo.png",
    badge: "/logo.png",
    // Collapses repeat notifications for the same order into one entry
    // rather than stacking five as an order moves through its statuses.
    tag: payload.data?.orderId ? `order-${payload.data.orderId}` : undefined,
    data: { deeplink },
  });
});

/* Focus an existing admin tab if one is open, rather than spawning a
 * second copy of the dashboard on every notification tap. */
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const deeplink = event.notification.data?.deeplink || "/";
  const target = new URL(deeplink, self.location.origin).href;

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url === target && "focus" in client) {
            return client.focus();
          }
        }
        for (const client of clientList) {
          if ("focus" in client && "navigate" in client) {
            return client.focus().then(() => client.navigate(target));
          }
        }
        return self.clients.openWindow(target);
      }),
  );
});
