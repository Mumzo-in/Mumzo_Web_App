import { Check } from "lucide-react";

import type { OrderStatus } from "../api/orders-api";
import { ORDER_FLOW, STATUS_META } from "../data/order-data";

export default function OrderStatusTimeline({
  status,
}: {
  status: OrderStatus;
}) {
  if (status === "cancelled") {
    return (
      <div className="rounded-2xl bg-destructive/10 px-4 py-3 font-semibold text-destructive text-sm">
        This order was cancelled.
      </div>
    );
  }

  if (status === "return_requested" || status === "returned") {
    return (
      <div className="rounded-2xl bg-amber-100 px-4 py-3 font-semibold text-amber-800 text-sm">
        {STATUS_META[status].label}
      </div>
    );
  }

  // `pending_payment` reads as the same step as `confirmed` on the timeline
  // (see STATUS_META) — treat it identically for the current-index lookup.
  const effectiveStatus = status === "pending_payment" ? "confirmed" : status;
  const currentIdx = ORDER_FLOW.indexOf(effectiveStatus);

  return (
    <ol className="flex flex-col">
      {ORDER_FLOW.map((step, i) => {
        const done = i <= currentIdx;
        const isLast = i === ORDER_FLOW.length - 1;
        return (
          <li key={step} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className={`flex size-7 shrink-0 items-center justify-center rounded-full border text-xs transition-colors ${
                  done
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border text-foreground/40"
                }`}
              >
                {done ? <Check size={13} /> : i + 1}
              </span>
              {!isLast && (
                <span
                  className={`w-px flex-1 ${i < currentIdx ? "bg-primary" : "bg-border"}`}
                />
              )}
            </div>
            <p
              className={`pb-6 font-semibold text-sm ${
                done ? "text-ink" : "text-foreground/40"
              }`}
            >
              {STATUS_META[step].label}
            </p>
          </li>
        );
      })}
    </ol>
  );
}
