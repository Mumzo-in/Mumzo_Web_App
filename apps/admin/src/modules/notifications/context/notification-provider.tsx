import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ShoppingBag, X } from "lucide-react";
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

function NewOrderToastCard({
  orderId,
  total,
  addressName,
  hubName,
  onClose,
}: {
  orderId: string;
  total: number;
  addressName: string;
  hubName: string;
  onClose: () => void;
}) {
  return (
    <div className="relative flex w-80 flex-col gap-3 rounded-2xl border border-rose-100 bg-rose-50/95 p-4 text-left shadow-xl backdrop-blur-md transition-all duration-300 hover:scale-[1.02]">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-3 right-3 rounded-full p-1 text-rose-400 hover:bg-rose-100 hover:text-rose-700"
        type="button"
      >
        <X className="size-4" />
      </button>

      {/* Header */}
      <div className="flex items-center gap-2 text-rose-700">
        <div className="flex size-8 items-center justify-center rounded-full bg-rose-100">
          <ShoppingBag className="size-4 animate-pulse text-rose-600" />
        </div>
        <div>
          <h4 className="font-semibold text-sm">New Order Received!</h4>
          <span className="font-mono text-[10px] text-rose-500 uppercase tracking-wider">
            #{orderId.slice(0, 8)}
          </span>
        </div>
      </div>

      {/* Details */}
      <div className="flex flex-col gap-1 text-rose-900/90 text-sm">
        <div className="flex justify-between border-rose-200/50 border-b pb-1">
          <span className="text-rose-600 text-xs">Hub</span>
          <span className="font-medium">{hubName}</span>
        </div>
        <div className="flex justify-between border-rose-200/50 border-b pb-1">
          <span className="text-rose-600 text-xs">Customer</span>
          <span className="max-w-[160px] truncate font-medium">
            {addressName}
          </span>
        </div>
        <div className="flex items-baseline justify-between pt-1">
          <span className="text-rose-600 text-xs">Total</span>
          <span className="font-bold text-lg text-rose-800">₹{total}</span>
        </div>
      </div>

      {/* Footer link */}
      <Link
        to="/operations/orders/$orderId"
        params={{ orderId }}
        onClick={onClose}
        className="flex w-full items-center justify-center rounded-xl bg-rose-600 py-2 text-center font-semibold text-white text-xs shadow-sm transition-colors hover:bg-rose-700 active:bg-rose-800"
      >
        View Order Details
      </Link>
    </div>
  );
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
   * Orders whose arrival toast and chime have already fired this session.
   *
   * One message can reach the handler twice — `onMessage` on a focused tab,
   * plus the service worker relay — and this keeps the noisy half of the
   * response (sound, toast) to once per order.
   */
  const seenOrderIds = useRef(new Set<string>());

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
      if (!orderId) return;

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
      function push(notification: OrderNotification) {
        setNotifications((prev) =>
          prev.some((existing) => existing.id === notification.id)
            ? prev
            : [notification, ...prev].slice(0, MAX_NOTIFICATIONS),
        );
      }

      // A rider closed an order from the delivery link — surface it, since
      // nobody in the panel performed this move.
      if (templateId === "admin.delivery.completed") {
        push({
          ...base,
          id: `${orderId}-delivery-${payload.data?.outcome ?? ""}`,
          kind: "delivery.completed",
          outcome: payload.data?.outcome ?? "delivered",
          detail: payload.notification?.body ?? "Delivery updated",
        });
        return;
      }

      // Status hops are recorded but stay quiet: a toast per hop would be
      // five toasts for one order's journey.
      if (templateId === "admin.order.status_updated") {
        push({
          ...base,
          id: `${orderId}-status-${payload.data?.toStatus ?? ""}`,
          kind: "order.status_updated",
          fromStatus: payload.data?.fromStatus ?? "",
          toStatus: payload.data?.toStatus ?? "",
        });
        return;
      }

      if (templateId !== "order.created") {
        return;
      }

      // The same order can arrive twice if a token is registered on two
      // rows for one staff member; the tray must not double-count it.
      if (seenOrderIds.current.has(orderId)) return;
      seenOrderIds.current.add(orderId);

      const total = Number(payload.data?.total ?? 0);
      const addressName = payload.data?.addressName ?? "Customer";
      const hubId = payload.data?.hubId ?? "";

      push({
        ...base,
        id: `${orderId}-created`,
        kind: "order.created",
        hubId,
        total,
        addressName,
      });
      playSound("newOrder");

      const hubName =
        hubsRef.current?.find((h) => h.id === hubId)?.name ?? "Unknown Hub";
      toast.custom(
        (id) => (
          <NewOrderToastCard
            orderId={orderId}
            total={total}
            addressName={addressName}
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
