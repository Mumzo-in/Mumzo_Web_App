import { useQueryClient } from "@tanstack/react-query";
import {
  createContext,
  type ReactNode,
  use,
  useCallback,
  useState,
} from "react";
import { toast } from "sonner";

import { queryKeys } from "@/core/api/query-keys";
import { useAdminRealtime } from "@/core/realtime";
import { playSound } from "@/core/sound";
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

  useAdminRealtime((event) => {
    console.info("[notifications] received event", event.type, event);
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
    console.info("[notifications] playing newOrder sound");
    playSound("newOrder");
    toast(`New order — ₹${event.data.total} from ${event.data.addressName}`);
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
