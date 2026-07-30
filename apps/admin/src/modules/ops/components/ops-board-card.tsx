import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Card } from "@mumzo/ui/components/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@mumzo/ui/components/dropdown-menu";
import { cn } from "@mumzo/ui/lib/utils";
import { MoreVertical } from "lucide-react";
import { formatMoney } from "@/core/components/format";
import {
  type AdminOrderSummary,
  PAYMENT_METHOD_LABELS,
} from "@/modules/orders";

type OpsBoardCardProps = {
  order: AdminOrderSummary;
  onCancel: (order: AdminOrderSummary) => void;
  onViewDetail: (order: AdminOrderSummary) => void;
};

export function OpsBoardCard({
  order,
  onCancel,
  onViewDetail,
}: OpsBoardCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: order.id, data: { order } });

  return (
    <Card
      ref={setNodeRef}
      className={cn(
        "cursor-grab gap-2 border border-border/60 p-3 active:cursor-grabbing",
        isDragging && "opacity-50",
      )}
      style={{ transform: CSS.Translate.toString(transform) }}
      data-testid={`ops-board-card-${order.id}`}
      {...attributes}
      {...listeners}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-0.5">
          <span className="font-medium text-foreground text-sm">
            #{order.id.slice(0, 8).toUpperCase()}
          </span>
          <span className="text-muted-foreground text-xs">{order.hubName}</span>
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

      <div className="flex items-center justify-end">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button
                type="button"
                className="rounded-none p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                data-testid={`ops-board-card-${order.id}-menu`}
                onPointerDown={(event) => event.stopPropagation()}
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
