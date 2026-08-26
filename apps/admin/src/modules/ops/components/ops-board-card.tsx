import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card } from "@mumzo/ui/components/card";
import { cn } from "@mumzo/ui/lib/utils";
import { GripHorizontal, Share2, X } from "lucide-react";
import { formatDateTime, formatMoney } from "@/core/components/format";
import {
  type AdminOrderSummary,
  PAYMENT_METHOD_LABELS,
} from "@/modules/orders";

type OpsBoardCardProps = {
  order: AdminOrderSummary;
  onCancel: (order: AdminOrderSummary) => void;
  onViewDetail: (order: AdminOrderSummary) => void;
  onShareLink: (order: AdminOrderSummary) => void;
  /** True for the floating copy rendered inside `DragOverlay` — not sortable
   * itself, just a visual clone that follows the pointer. */
  overlay?: boolean;
};

export function OpsBoardCard({
  order,
  onCancel,
  onViewDetail,
  onShareLink,
  overlay = false,
}: OpsBoardCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: order.id, data: { order } });

  return (
    <Card
      ref={overlay ? undefined : setNodeRef}
      className={cn(
        "shrink-0 gap-0 overflow-hidden border border-border/60 p-0",
        isDragging && !overlay && "opacity-40",
        overlay && "shadow-lg",
      )}
      style={
        overlay
          ? undefined
          : {
              transform: CSS.Transform.toString(transform),
              transition,
            }
      }
      data-testid={`ops-board-card-${order.id}`}
    >
      <div
        className="flex cursor-grab items-center justify-center border-border/60 border-b bg-secondary/40 py-1 active:cursor-grabbing"
        data-testid={`ops-board-card-${order.id}-handle`}
        {...(overlay ? {} : attributes)}
        {...(overlay ? {} : listeners)}
      >
        <GripHorizontal className="size-3.5 text-muted-foreground" />
      </div>

      <button
        type="button"
        onClick={() => onViewDetail(order)}
        data-testid={`ops-board-card-${order.id}-content`}
        className="flex cursor-pointer flex-col gap-2 p-3 text-left transition-colors hover:bg-accent/40"
      >
        <div className="flex items-start justify-between gap-2">
          <span className="font-semibold text-foreground text-sm">
            #{order.id.slice(0, 8).toUpperCase()}
          </span>
          <span className="numeric font-semibold text-foreground text-sm">
            {formatMoney(order.total)}
          </span>
        </div>

        <div className="flex items-center justify-between gap-2">
          <span className="numeric text-muted-foreground text-xs">
            {formatDateTime(order.placedAt)}
          </span>
          <span className="text-muted-foreground text-xs">
            {PAYMENT_METHOD_LABELS[order.paymentMethod] ?? order.paymentMethod}
          </span>
        </div>

        <div className="flex flex-col gap-0.5">
          <span className="text-foreground text-xs">{order.customerName}</span>
          <span className="numeric text-muted-foreground text-xs">
            {order.itemCount} item{order.itemCount === 1 ? "" : "s"} ·{" "}
            {order.hubName}
          </span>
        </div>
      </button>

      <div className="flex items-center justify-between border-border/60 border-t">
        <button
          type="button"
          onClick={() => onViewDetail(order)}
          data-testid={`ops-board-card-${order.id}-view`}
          className="flex-1 px-2 py-1.5 text-center text-muted-foreground text-xs transition-colors hover:bg-accent hover:text-foreground"
        >
          View detail
        </button>
        {order.status === "out_for_delivery" && (
          <>
            <div className="h-full w-px self-stretch bg-border/60" />
            <button
              type="button"
              onClick={() => onShareLink(order)}
              data-testid={`ops-board-card-${order.id}-share`}
              className="flex flex-1 items-center justify-center gap-1 px-2 py-1.5 text-center text-primary text-xs transition-colors hover:bg-primary/10"
            >
              <Share2 className="size-3" />
              Link
            </button>
          </>
        )}
        {order.status !== "delivered" && order.status !== "cancelled" && (
          <>
            <div className="h-full w-px self-stretch bg-border/60" />
            <button
              type="button"
              onClick={() => onCancel(order)}
              data-testid={`ops-board-card-${order.id}-cancel`}
              className="flex flex-1 items-center justify-center gap-1 px-2 py-1.5 text-center text-destructive text-xs transition-colors hover:bg-destructive/10"
            >
              <X className="size-3" />
              Cancel
            </button>
          </>
        )}
      </div>
    </Card>
  );
}

export default OpsBoardCard;
