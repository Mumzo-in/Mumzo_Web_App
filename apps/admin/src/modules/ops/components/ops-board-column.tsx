import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { cn } from "@mumzo/ui/lib/utils";
import { useMemo } from "react";
import type { AdminOrderSummary } from "@/modules/orders";
import type { BoardColumnStatus } from "../data/ops-board-data";
import OpsBoardCard from "./ops-board-card";

type OpsBoardColumnProps = {
  status: BoardColumnStatus;
  label: string;
  orders: AdminOrderSummary[];
  onCancel: (order: AdminOrderSummary) => void;
  onViewDetail: (order: AdminOrderSummary) => void;
  onShareLink: (order: AdminOrderSummary) => void;
  /** Rendered as a hint under the column title — optional steps can be
   * skipped by dragging past them. */
  optional?: boolean;
};

export function OpsBoardColumn({
  status,
  label,
  orders,
  onCancel,
  onViewDetail,
  onShareLink,
  optional = false,
}: OpsBoardColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const itemIds = useMemo(() => orders.map((order) => order.id), [orders]);

  return (
    <div className="flex h-full min-w-72 flex-1 flex-col gap-3">
      <div className="flex items-center justify-between px-1">
        <span className="flex items-center gap-1.5 font-medium text-foreground text-sm">
          {label}
          {optional ? (
            <span className="rounded-full bg-secondary px-2 py-0.5 font-normal text-[10px] text-muted-foreground">
              Optional
            </span>
          ) : null}
        </span>
        <span className="numeric text-muted-foreground text-xs">
          {orders.length}
        </span>
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          "flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto border border-border/60 bg-card p-2 transition-colors",
          isOver && "bg-accent/60",
        )}
        data-testid={`ops-board-column-${status}`}
      >
        <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
          {orders.length === 0 ? (
            <div className="flex flex-1 items-center justify-center py-8 text-muted-foreground text-xs">
              No orders
            </div>
          ) : (
            orders.map((order) => (
              <OpsBoardCard
                key={order.id}
                order={order}
                onCancel={onCancel}
                onViewDetail={onViewDetail}
                onShareLink={onShareLink}
              />
            ))
          )}
        </SortableContext>
      </div>
    </div>
  );
}

export default OpsBoardColumn;
