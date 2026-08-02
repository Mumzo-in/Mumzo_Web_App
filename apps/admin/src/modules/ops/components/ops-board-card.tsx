import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card } from "@mumzo/ui/components/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@mumzo/ui/components/dropdown-menu";
import { cn } from "@mumzo/ui/lib/utils";
import { GripHorizontal, MoreVertical } from "lucide-react";
import { formatMoney } from "@/core/components/format";
import {
  type AdminOrderSummary,
  PAYMENT_METHOD_LABELS,
} from "@/modules/orders";

type OpsBoardCardProps = {
  order: AdminOrderSummary;
  onCancel: (order: AdminOrderSummary) => void;
  onViewDetail: (order: AdminOrderSummary) => void;
  /** True for the floating copy rendered inside `DragOverlay` — not sortable
   * itself, just a visual clone that follows the pointer. */
  overlay?: boolean;
};

export function OpsBoardCard({
  order,
  onCancel,
  onViewDetail,
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
        "gap-0 overflow-hidden border border-border/60 p-0",
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
          <div className="flex flex-col gap-0.5">
            <span className="font-medium text-foreground text-sm">
              #{order.id.slice(0, 8).toUpperCase()}
            </span>
            <span className="text-muted-foreground text-xs">
              {order.hubName}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-0.5">
          <span className="text-foreground text-xs">{order.customerName}</span>
          <span className="numeric text-muted-foreground text-xs">
            {order.itemCount} item{order.itemCount === 1 ? "" : "s"} ·{" "}
            {formatMoney(order.total)} ·{" "}
            {PAYMENT_METHOD_LABELS[order.paymentMethod] ?? order.paymentMethod}
          </span>
        </div>
      </button>

      <div className="flex items-center justify-end border-border/60 border-t px-1 py-1">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button
                type="button"
                className="rounded-none p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                data-testid={`ops-board-card-${order.id}-menu`}
              />
            }
          >
            <MoreVertical className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onViewDetail(order)}>
              View detail
            </DropdownMenuItem>
            {order.status !== "delivered" && order.status !== "cancelled" && (
              <DropdownMenuItem
                variant="destructive"
                onClick={() => onCancel(order)}
              >
                Cancel order
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </Card>
  );
}

export default OpsBoardCard;
