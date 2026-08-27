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
 * Config arrives as query params on the registration URL rather than being
 * inlined here: this file is served verbatim from `public/` and never
 * passes through Vite's transform, so it cannot read `import.meta.env`, and
 * a hardcoded copy silently drifts from `.env` — which initialises a
 * *different* Firebase app that receives nothing at all, with no error to
 * show for it.
 *
 * These are public client values, the same ones Firebase embeds in any web
 * bundle, so passing them through the URL leaks nothing.
 */

importScripts(
  "https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js",
);
importScripts(
  "https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js",
);

const params = new URL(self.location.href).searchParams;

firebase.initializeApp({
  apiKey: params.get("apiKey"),
  authDomain: params.get("authDomain"),
  projectId: params.get("projectId"),
  storageBucket: params.get("storageBucket"),
  messagingSenderId: params.get("messagingSenderId"),
  appId: params.get("appId"),
});

const messaging = firebase.messaging();

/*
 * Fires only when no admin tab has focus — a focused tab gets `onMessage`
 * in the app instead, which shows the in-app toast. The two must not both
 * fire for one notification, hence the split.
 */
messaging.onBackgroundMessage(async (payload) => {
  const title = payload.notification?.title ?? "Mumzo";
  const body = payload.notification?.body ?? "";
  const deeplink = payload.data?.deeplink || "/";

  // Visible under the service worker's own console in DevTools
  // (Application → Service Workers → inspect), not the page console.
  console.info(
    `[fcm-sw] background message: ${payload.data?.templateId ?? "(no templateId)"}`,
    payload.data,
  );

  // Hand the payload to any open admin tab so its notification tray records
  // the event even though this arrived while the tab was unfocused. Without
  // this the tray only ever sees messages that landed on a focused tab, and
  // anything that arrived in the background is lost once its OS popup is
  // dismissed — which is exactly the case the tray exists for.
  const clients = await self.clients.matchAll({
    type: "window",
    includeUncontrolled: true,
  });
  for (const client of clients) {
    client.postMessage({ type: "mumzo:notification", payload });
  }
  console.info(`[fcm-sw] relayed to ${clients.length} open tab(s)`);

  self.registration.showNotification(title, {
    body,
    icon: "/logo.png",
    badge: "/logo.png",
    // Collapses repeats of the *same event* for one order into a single
    // tray entry. Scoped by template as well as order: keyed on the order
    // alone, a "delivered" notification would silently replace the "new
    // order" one rather than appearing alongside it.
    tag: payload.data?.orderId
      ? `${payload.data.templateId || "notification"}-${payload.data.orderId}`
      : undefined,
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
