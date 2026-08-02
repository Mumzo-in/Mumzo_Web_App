import { Check } from "lucide-react";

import type { OrderStatus, OrderStatusLogEntry } from "../api/orders-api";
import { formatOrderDate, ORDER_FLOW, STATUS_META } from "../data/order-data";

/** Latest log entry landing on each `ORDER_FLOW` step, keyed by the
 * collapsed status (pending_payment folds into confirmed, same as the
 * timeline steps themselves). Later entries win if a status was re-logged. */
function timestampsByStep(
  statusLog: OrderStatusLogEntry[],
): Partial<Record<OrderStatus, string>> {
  const map: Partial<Record<OrderStatus, string>> = {};
  for (const entry of statusLog) {
    const step =
      entry.toStatus === "pending_payment" ? "confirmed" : entry.toStatus;
    map[step] = entry.createdAt;
  }
  return map;
}

export default function OrderStatusTimeline({
  status,
  statusLog = [],
}: {
  status: OrderStatus;
  statusLog?: OrderStatusLogEntry[];
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
  const stepTimestamps = timestampsByStep(statusLog);

  return (
    <ol className="flex flex-col">
      {ORDER_FLOW.map((step, i) => {
        const done = i <= currentIdx;
        const isLast = i === ORDER_FLOW.length - 1;
        const timestamp = stepTimestamps[step];
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
            <div className="pb-6">
              <p
                className={`font-semibold text-sm ${
                  done ? "text-ink" : "text-foreground/40"
                }`}
              >
                {STATUS_META[step].label}
              </p>
              {timestamp && (
                <p className="mt-0.5 text-foreground/50 text-xs">
                  {formatOrderDate(timestamp)}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
