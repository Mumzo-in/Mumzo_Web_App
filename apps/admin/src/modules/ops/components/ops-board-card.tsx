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
  type AdminOrder,
  isSlaBreached,
  PAYMENT_MODE_LABELS,
} from "@/modules/orders";

type OpsBoardCardProps = {
  order: AdminOrder;
  onCancel: (order: AdminOrder) => void;
  onViewDetail: (order: AdminOrder) => void;
};

/** Minutes remaining until `slaDueAt`, negative when overdue. */
function minutesToSla(order: AdminOrder, now: Date): number {
  return Math.round(
    (new Date(order.slaDueAt).getTime() - now.getTime()) / 60_000,
  );
}

function slaTint(order: AdminOrder, now: Date): string {
  if (isSlaBreached(order, now)) {
    return "bg-destructive/10 text-destructive";
  }
  const minutesLeft = minutesToSla(order, now);
  if (minutesLeft <= 5) {
    return "bg-status-warning/10 text-status-warning";
  }
  return "bg-status-success/10 text-status-success";
}

function slaLabel(order: AdminOrder, now: Date): string {
  if (order.status === "delivered") {
    return "Delivered";
  }
  const minutesLeft = minutesToSla(order, now);
  if (minutesLeft < 0) {
    return `${Math.abs(minutesLeft)}m late`;
  }
  return `${minutesLeft}m left`;
}

export function OpsBoardCard({
  order,
  onCancel,
  onViewDetail,
}: OpsBoardCardProps) {
  const now = new Date();
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
            {order.reference}
          </span>
          <span className="text-muted-foreground text-xs">{order.hub}</span>
        </div>
        <span
          className={cn(
            "rounded-full px-2 py-0.5 font-medium text-[10px]",
            slaTint(order, now),
          )}
        >
          {slaLabel(order, now)}
        </span>
      </div>

      <div className="flex flex-col gap-0.5">
        <span className="text-foreground text-xs">{order.customerName}</span>
        <span className="numeric text-muted-foreground text-xs">
          {order.itemCount} item{order.itemCount === 1 ? "" : "s"} ·{" "}
          {formatMoney(order.total)} · {PAYMENT_MODE_LABELS[order.paymentMode]}
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
