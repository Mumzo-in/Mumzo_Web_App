import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";

import { rupee } from "@/modules/cart";
import type { OrderSummary } from "../api/orders-api";
import { formatOrderDate, STATUS_META } from "../data/order-data";

export default function OrderCard({ order }: { order: OrderSummary }) {
  const meta = STATUS_META[order.status];

  return (
    <Link
      to="/orders/$orderId"
      params={{ orderId: order.id }}
      data-testid={`web-order-${order.id}`}
      className="flex flex-col gap-4 rounded-3xl border border-border/60 bg-white p-5 transition-colors hover:border-primary/40"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-ink text-sm">
            #{order.id.slice(0, 8).toUpperCase()}
          </p>
          <p className="text-foreground/55 text-xs">
            {formatOrderDate(order.placedAt)}
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 font-semibold text-xs ${meta.tint}`}
        >
          {meta.label}
        </span>
      </div>

      <div className="flex items-center justify-between border-border/60 border-t pt-4">
        <span className="text-foreground/60 text-xs">
          {order.itemCount} {order.itemCount === 1 ? "item" : "items"} ·{" "}
          <span className="font-semibold text-ink">{rupee(order.total)}</span>
        </span>
        <span className="inline-flex items-center gap-1 font-semibold text-primary text-xs">
          View details
          <ChevronRight size={14} />
        </span>
      </div>
    </Link>
  );
}
