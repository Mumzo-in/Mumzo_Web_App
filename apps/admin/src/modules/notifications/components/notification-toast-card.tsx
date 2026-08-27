import { Button } from "@mumzo/ui/components/button";
import { cn } from "@mumzo/ui/lib/utils";
import { Link } from "@tanstack/react-router";
import {
  CheckCircle2,
  type LucideIcon,
  ShoppingBag,
  TriangleAlert,
  Truck,
  X,
} from "lucide-react";

import { formatMoney } from "@/core/components/format";
import type { OrderNotification } from "../data/types";

/**
 * One toast for every notification kind, rather than a bespoke component
 * per event.
 *
 * `describe()` is the only place a kind's presentation lives — heading,
 * icon, accent, and the detail rows worth showing. Adding a kind is a case
 * there; nothing in the JSX below changes. The previous per-event approach
 * meant a new event silently rendered nothing, which reads as "the
 * notification never arrived".
 */

type DetailRow = { label: string; value: string };

type Presentation = {
  icon: LucideIcon;
  heading: string;
  /** Semantic accent — never a raw colour, so themes stay coherent. */
  accent: "primary" | "success" | "danger";
  rows: DetailRow[];
};

function describe(
  notification: OrderNotification,
  hubName: string,
): Presentation {
  switch (notification.kind) {
    case "order.created":
      return {
        icon: ShoppingBag,
        heading: "New order received",
        accent: "primary",
        rows: [
          { label: "Hub", value: hubName },
          { label: "Customer", value: notification.addressName },
          { label: "Total", value: formatMoney(notification.total) },
        ],
      };

    case "order.status_updated":
      return {
        icon: Truck,
        heading: "Order updated",
        accent: "primary",
        rows: [
          { label: "From", value: notification.fromStatus || "—" },
          { label: "To", value: notification.toStatus || "—" },
        ],
      };

    default: {
      const failed = notification.outcome !== "delivered";
      return {
        icon: failed ? TriangleAlert : CheckCircle2,
        heading: failed ? "Delivery failed" : "Order delivered",
        accent: failed ? "danger" : "success",
        rows: [
          { label: "Outcome", value: notification.outcome },
          { label: "Details", value: notification.detail },
        ],
      };
    }
  }
}

const ACCENT_ICON = {
  primary: "bg-primary/10 text-primary",
  success: "bg-status-success/10 text-status-success",
  danger: "bg-status-danger/10 text-status-danger",
} as const;

export function NotificationToastCard({
  notification,
  hubName,
  onClose,
}: {
  notification: OrderNotification;
  hubName: string;
  onClose: () => void;
}) {
  const { icon: Icon, heading, accent, rows } = describe(notification, hubName);

  return (
    <div
      className="relative flex w-80 flex-col gap-3 rounded-2xl border border-border bg-card p-4 text-left shadow-warm"
      data-testid="notification-toast"
    >
      <Button
        variant="ghost"
        size="icon"
        onClick={onClose}
        aria-label="Dismiss notification"
        className="absolute top-2 right-2 size-7"
      >
        <X data-icon />
      </Button>

      <div className="flex items-center gap-2 pr-8">
        <div
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-full",
            ACCENT_ICON[accent],
          )}
        >
          <Icon className="size-4" />
        </div>
        <div className="min-w-0">
          <h4 className="truncate font-semibold text-foreground text-sm">
            {heading}
          </h4>
          <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
            #{notification.orderId.slice(0, 8)}
          </span>
        </div>
      </div>

      <dl className="flex flex-col gap-1 text-sm">
        {rows.map((row, index) => (
          <div
            key={row.label}
            className={cn(
              "flex items-baseline justify-between gap-3",
              index < rows.length - 1 && "border-border/60 border-b pb-1",
            )}
          >
            <dt className="shrink-0 text-muted-foreground text-xs">
              {row.label}
            </dt>
            <dd className="min-w-0 truncate font-medium text-foreground">
              {row.value}
            </dd>
          </div>
        ))}
      </dl>

      <Button
        // `nativeButton={false}` because this renders a <Link> (an anchor),
        // not a <button> — base-ui warns otherwise, since silently swapping
        // the element would drop native button semantics.
        nativeButton={false}
        render={
          <Link
            to="/operations/orders/$orderId"
            params={{ orderId: notification.orderId }}
            onClick={onClose}
          />
        }
        size="sm"
        className="w-full"
      >
        View order details
      </Button>
    </div>
  );
}
