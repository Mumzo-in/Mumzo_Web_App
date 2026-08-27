import { Badge } from "@mumzo/ui/components/badge";
import { cn } from "@mumzo/ui/lib/utils";
import { Link } from "@tanstack/react-router";
import {
  Ban,
  CheckCircle2,
  PackagePlus,
  TriangleAlert,
  Truck,
} from "lucide-react";
import { formatDateTime, formatMoney } from "@/core/components/format";
import type { OrderNotification } from "../data/types";

/** Icon, heading and one-line summary per notification kind. Kept in one
 * place so a new kind is a single case rather than three scattered
 * conditionals in the JSX below. */
function presentation(notification: OrderNotification) {
  switch (notification.kind) {
    case "order.created":
      return {
        icon: PackagePlus,
        tone: "text-primary bg-primary/10",
        title: "New order",
        summary: `${formatMoney(notification.total)} — ${notification.addressName}`,
      };
    case "order.status_updated":
      return {
        icon: Truck,
        tone: "text-primary bg-primary/10",
        title: "Order updated",
        summary: `${notification.fromStatus} → ${notification.toStatus}`,
      };
    case "order.cancelled":
      return {
        icon: Ban,
        tone: "text-status-danger bg-status-danger/10",
        title: "Order cancelled",
        summary: notification.reason
          ? `Was "${notification.fromStatus}" — ${notification.reason}`
          : `Cancelled from "${notification.fromStatus}"`,
      };
    default: {
      const failed = notification.outcome !== "delivered";
      return {
        icon: failed ? TriangleAlert : CheckCircle2,
        tone: failed
          ? "text-status-danger bg-status-danger/10"
          : "text-status-success bg-status-success/10",
        title: failed ? "Delivery failed" : "Order delivered",
        summary: notification.detail,
      };
    }
  }
}

export function NotificationCard({
  notification,
  onOpen,
}: {
  notification: OrderNotification;
  onOpen: (id: string) => void;
}) {
  const { icon: Icon, tone, title, summary } = presentation(notification);

  return (
    <Link
      to="/operations/orders/$orderId"
      params={{ orderId: notification.orderId }}
      onClick={() => onOpen(notification.id)}
      data-testid="notification-card"
      className={cn(
        "flex items-start gap-3 rounded-2xl border border-transparent p-3 transition-colors hover:bg-accent",
        !notification.read && "bg-secondary",
      )}
    >
      <div
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-full",
          tone,
        )}
      >
        <Icon className="size-4" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-center gap-2">
          <p className="font-medium text-foreground text-sm">{title}</p>
          {!notification.read && (
            <Badge variant="default" className="h-4 px-1.5 text-[10px]">
              New
            </Badge>
          )}
        </div>
        <p className="truncate text-muted-foreground text-sm">{summary}</p>
        <p className="text-muted-foreground text-xs">
          {formatDateTime(notification.receivedAt)}
        </p>
      </div>
    </Link>
  );
}
