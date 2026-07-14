import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";

import { rupee } from "@/modules/cart";
import { formatOrderDate, type Order, STATUS_META } from "../data/order-data";

export default function OrderCard({ order }: { order: Order }) {
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
          <p className="font-semibold text-ink text-sm">#{order.id}</p>
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

      <div className="flex items-center gap-3">
        <div className="flex -space-x-3">
          {order.items.slice(0, 4).map((item) => (
            <img
              key={item.id}
              src={item.img}
              alt={item.name}
              className="size-12 rounded-full border-2 border-white object-cover"
            />
          ))}
        </div>
        <p className="flex-1 truncate text-foreground/70 text-sm">
          {order.items.map((i) => i.name).join(", ")}
        </p>
      </div>

      <div className="flex items-center justify-between border-border/60 border-t pt-4">
        <span className="text-foreground/60 text-xs">
          {order.items.reduce((s, i) => s + i.qty, 0)} items ·{" "}
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
