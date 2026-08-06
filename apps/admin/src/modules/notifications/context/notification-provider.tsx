import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ShoppingBag, X } from "lucide-react";
import {
  createContext,
  type ReactNode,
  use,
  useCallback,
  useEffect,
  useState,
} from "react";
import { toast } from "sonner";

import { queryKeys } from "@/core/api/query-keys";
import { showBrowserNotification } from "@/core/notifications";
import { useAdminRealtime } from "@/core/realtime";
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
 * The single owner of the admin WS connection (via `useAdminRealtime`) and
 * the client-side order-notification tray — bell badge count, popover list,
 * and the new-order sound/toast all read from this one place. Mount once,
 * globally (see `pages/(admin)/_layout.tsx`), so every page shares one
 * connection and one notification history instead of re-subscribing per
 * route. See docs/infra/realtime-architecture.md for the server side.
 */
export function NotificationProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [notifications, setNotifications] = useState<OrderNotification[]>([]);

  const { data: hubs } = useQuery(hubsAllQueryOptions);

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

  useAdminRealtime((event) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });

    if (event.type !== "order.created") {
      return;
    }

    const notification: OrderNotification = {
      id: `${event.data.orderId}-${event.emittedAt}`,
      orderId: event.data.orderId,
      hubId: event.data.hubId,
      total: event.data.total,
      addressName: event.data.addressName,
      receivedAt: event.emittedAt,
      read: false,
    };

    setNotifications((prev) =>
      [notification, ...prev].slice(0, MAX_NOTIFICATIONS),
    );
    playSound("newOrder");

    const hubName =
      hubs?.find((h) => h.id === event.data.hubId)?.name ?? "Unknown Hub";
    toast.custom(
      (id) => (
        <NewOrderToastCard
          orderId={event.data.orderId}
          total={event.data.total}
          addressName={event.data.addressName}
          hubName={hubName}
          onClose={() => toast.dismiss(id)}
        />
      ),
      {
        duration: 15000,
      },
    );

    showBrowserNotification(
      "New order",
      `₹${event.data.total} — ${event.data.addressName}`,
    );
  });

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
