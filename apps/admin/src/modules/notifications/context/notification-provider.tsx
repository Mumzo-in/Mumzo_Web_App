import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { MessagePayload } from "firebase/messaging";
import {
  createContext,
  type ReactNode,
  use,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";

import { queryKeys } from "@/core/api/query-keys";
import { onForegroundMessage } from "@/core/notifications";
import { playSound, unlockAudio } from "@/core/sound";
import { hubsAllQueryOptions } from "@/modules/hub";
import { NotificationToastCard } from "../components/notification-toast-card";
import type { OrderNotification } from "../data/types";

const MAX_NOTIFICATIONS = 50;

type NotificationContextValue = {
  notifications: OrderNotification[];
  unreadCount: number;
  markAllRead: () => void;
  markRead: (id: string) => void;
  clear: () => void;
};

const NotificationContext = createContext<NotificationContextValue | null>(
  null,
);

/** Fields every notification carries, before its kind-specific ones. */
type NotificationBase = {
  orderId: string;
  receivedAt: string;
  read: boolean;
};

/**
 * Maps one FCM message to a tray notification, or null when no kind
 * matches.
 *
 * The id is derived from the message's own content rather than the clock:
 * the same event can arrive twice (foreground listener plus service-worker
 * relay), and a timestamped id would make those look like two events.
 */
function toNotification(
  templateId: string | undefined,
  orderId: string,
  base: NotificationBase,
  payload: MessagePayload,
): OrderNotification | null {
  const data = payload.data ?? {};

  switch (templateId) {
    case "order.created":
      return {
        ...base,
        id: `${orderId}-created`,
        kind: "order.created",
        hubId: data.hubId ?? "",
        total: Number(data.total ?? 0),
        addressName: data.addressName ?? "Customer",
      };

    case "admin.order.status_updated":
      return {
        ...base,
        id: `${orderId}-status-${data.toStatus ?? ""}`,
        kind: "order.status_updated",
        fromStatus: data.fromStatus ?? "",
        toStatus: data.toStatus ?? "",
      };

    case "admin.delivery.completed":
      return {
        ...base,
        id: `${orderId}-delivery-${data.outcome ?? ""}`,
        kind: "delivery.completed",
        outcome: data.outcome ?? "delivered",
        detail: payload.notification?.body ?? "Delivery updated",
      };

    case "admin.order.cancelled":
      return {
        ...base,
        id: `${orderId}-cancelled`,
        kind: "order.cancelled",
        fromStatus: data.fromStatus ?? "",
        reason: data.reason ?? "",
      };

    default:
      return null;
  }
}

/**
 * The client-side notification tray — bell badge count, popover list, and
 * the new-order sound/toast all read from this one place. Mount once,
 * globally (see `pages/(admin)/_layout.tsx`), so every page shares one
 * notification history instead of re-subscribing per route.
 *
 * FCM is the only feed; the admin websocket it used to own was removed in
 * favour of push. See docs/infra/notifications-architecture.md.
 */
export function NotificationProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [notifications, setNotifications] = useState<OrderNotification[]>([]);
  /**
   * Notification ids already surfaced this session.
   *
   * One message can reach the handler twice — `onMessage` on a focused tab,
   * plus the service worker relay — so this keeps both the tray entry and
   * the toast/chime to once per event. Held in a ref rather than derived
   * from state so the check is synchronous: two messages arriving in the
   * same tick would both read a stale `notifications` array.
   */
  const seenIds = useRef(new Set<string>());

  const { data: hubs } = useQuery(hubsAllQueryOptions);

  // Read by the message handler without being a dependency of the effect
  // that installs it — see the note on that effect's dependency array.
  const hubsRef = useRef(hubs);
  hubsRef.current = hubs;

  // Auto-unlock audio on the first gesture anywhere on the site
  useEffect(() => {
    function handleGesture() {
      unlockAudio();
      document.removeEventListener("pointerdown", handleGesture);
      document.removeEventListener("keydown", handleGesture);
    }
    document.addEventListener("pointerdown", handleGesture);
    document.addEventListener("keydown", handleGesture);
    return () => {
      document.removeEventListener("pointerdown", handleGesture);
      document.removeEventListener("keydown", handleGesture);
    };
  }, []);

  /**
   * FCM foreground messages — the only live feed the panel has since the
   * admin websocket was removed.
   *
   * `templateId` is what distinguishes one event from another now that
   * everything arrives over one channel; the templates in
   * `@mumzo/notifications` set it alongside `orderId`.
   *
   * Messages arrive from two sources: `onMessage` while the tab is
   * focused, and a relay from `firebase-messaging-sw.js` for everything
   * that landed while it wasn't. Both feed this one handler, so the tray
   * records background events too — `push()` dedupes the overlap.
   */
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    let cancelled = false;

    onForegroundMessage((payload) => {
      // Any order event means the board is stale, whatever it was.
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });

      const orderId = payload.data?.orderId;
      if (!orderId) {
        console.warn(
          "[notifications] ignoring message with no data.orderId:",
          payload.data,
        );
        return;
      }

      const templateId = payload.data?.templateId;
      const base = {
        orderId,
        receivedAt: new Date().toISOString(),
        read: false,
      };

      /**
       * Every kind lands in the bell/panel — that tray is the record of
       * what happened while nobody was looking, so dropping an event here
       * makes it unrecoverable once its toast fades.
       *
       * Deduped on the notification's own id rather than on arrival time:
       * one message can reach this handler twice (once via `onMessage`,
       * once relayed by the service worker), and a timestamped id would
       * make those two look like two distinct events.
       */
      function push(notification: OrderNotification): boolean {
        // `setNotifications` may run its updater twice under StrictMode, so
        // "was this new?" is decided against a ref the updater doesn't
        // touch — deciding inside the updater would make the toast fire
        // twice in development.
        if (seenIds.current.has(notification.id)) {
          console.info(`[notifications] duplicate ignored: ${notification.id}`);
          return false;
        }
        seenIds.current.add(notification.id);

        console.info(
          `[notifications] → tray: ${notification.kind} (${notification.id})`,
        );
        setNotifications((prev) =>
          [notification, ...prev].slice(0, MAX_NOTIFICATIONS),
        );
        return true;
      }

      // Build the notification from the message, then take one shared path
      // for every kind. A per-kind branch that also had to remember to
      // raise its own toast is how delivery events ended up recorded but
      // invisible.
      const notification = toNotification(templateId, orderId, base, payload);

      if (!notification) {
        // Reached only by a template the tray has no case for — worth a
        // line, since the symptom (nothing appears) is identical to the
        // message never arriving at all.
        console.warn(
          `[notifications] no tray handler for templateId "${templateId}" — message ignored`,
        );
        return;
      }

      const isNew = push(notification);
      if (!isNew) return;

      // Only events worth looking up for make a sound: a new order to
      // pack, a cancellation to stop packing, and a delivery closing out.
      // A chime per status hop would be five chimes for one order's
      // journey, which trains staff to ignore all of them.
      //
      // A failed delivery deliberately gets no sound rather than the
      // success one — it shares the `delivery.completed` template, and the
      // cheerful chime would read as "delivered" to anyone not looking.
      if (notification.kind === "order.created") {
        playSound("newOrder");
      } else if (notification.kind === "order.cancelled") {
        playSound("orderCancelled");
      } else if (
        notification.kind === "delivery.completed" &&
        notification.outcome === "delivered"
      ) {
        playSound("orderDelivered");
      }

      const hubName =
        notification.kind === "order.created"
          ? (hubsRef.current?.find((h) => h.id === notification.hubId)?.name ??
            "Unknown Hub")
          : "";

      toast.custom(
        (id) => (
          <NotificationToastCard
            notification={notification}
            hubName={hubName}
            onClose={() => toast.dismiss(id)}
          />
        ),
        { duration: 15000 },
      );
    })
      .then((fn) => {
        if (cancelled) {
          fn();
          return;
        }
        unsubscribe = fn;
      })
      .catch((error) => {
        console.error("[notifications] foreground listener failed:", error);
      });

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
    // Subscribes once for the lifetime of the provider. `hubs` is read
    // through a ref rather than listed here on purpose: it arrives from an
    // async query, and depending on it tore the listener down and rebuilt
    // it mid-session — `onForegroundMessage` is itself async, so every
    // message that landed during that gap was dropped.
  }, [queryClient]);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const markRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  }, []);

  const clear = useCallback(() => {
    setNotifications([]);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationContext
      value={{ notifications, unreadCount, markAllRead, markRead, clear }}
    >
      {children}
    </NotificationContext>
  );
}

export function useNotifications() {
  const context = use(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotifications must be used within NotificationProvider",
    );
  }
  return context;
}
