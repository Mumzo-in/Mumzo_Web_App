import {
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { queryKeys } from "@/core/api/query-keys";
import type { DateRange } from "@/core/components/date-range/date-range-presets";
import { resolveDateRangePreset } from "@/core/components/date-range/date-range-presets";
import {
  type AdminOrderSummary,
  listOrders,
  type OrderStatus,
  updateOrderStatus,
} from "@/modules/orders";
import { BOARD_COLUMNS, type BoardColumnStatus } from "../data/ops-board-data";
import OpsBoardColumn from "./ops-board-column";
import OpsBoardToolbar from "./ops-board-toolbar";
import OpsCancelledBadge from "./ops-cancelled-badge";

const TODAY_RANGE = resolveDateRangePreset("today");
/** Board polls rather than pushing — no websocket infra exists yet. */
const REFETCH_INTERVAL_MS = 20_000;

function isWithinRange(iso: string, range: DateRange): boolean {
  const day = iso.slice(0, 10);
  return day >= range.from && day <= range.to;
}

function isValidStatus(id: string): id is BoardColumnStatus {
  return BOARD_COLUMNS.some((column) => column.status === id);
}

export function OpsBoard() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [range, setRange] = useState<DateRange>(TODAY_RANGE);

  const { data } = useQuery({
    queryKey: queryKeys.orders.list(range),
    queryFn: () => listOrders({ limit: 500 }),
    refetchInterval: REFETCH_INTERVAL_MS,
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor),
  );

  const ordersForDay = useMemo(() => {
    const rows = data?.data ?? [];
    const needle = search.trim().toLowerCase();

    return rows.filter((order) => {
      if (!isWithinRange(order.placedAt, range)) {
        return false;
      }
      if (!needle) {
        return true;
      }
      return (
        order.id.toLowerCase().includes(needle) ||
        order.customerName.toLowerCase().includes(needle)
      );
    });
  }, [data, range, search]);

  const ordersByStatus = useMemo(() => {
    const map = new Map<BoardColumnStatus, AdminOrderSummary[]>();
    for (const column of BOARD_COLUMNS) {
      map.set(
        column.status,
        ordersForDay.filter((order) => {
          const status =
            order.status === "pending_payment" ? "confirmed" : order.status;
          return status === column.status;
        }),
      );
    }
    return map;
  }, [ordersForDay]);

  const cancelledCount = ordersForDay.filter(
    (order) =>
      order.status === "cancelled" ||
      order.status === "return_requested" ||
      order.status === "returned",
  ).length;

  async function moveOrder(orderId: string, status: OrderStatus) {
    const previous = queryClient.getQueryData(queryKeys.orders.list(range));

    // Optimistic — avoids a visual snap-back while the PATCH is in flight.
    queryClient.setQueryData(
      queryKeys.orders.list(range),
      (current: typeof data) =>
        current
          ? {
              ...current,
              data: current.data.map((order) =>
                order.id === orderId ? { ...order, status } : order,
              ),
            }
          : current,
    );

    try {
      await updateOrderStatus(orderId, status);
    } catch (error) {
      queryClient.setQueryData(queryKeys.orders.list(range), previous);
      toast.error(
        error instanceof Error ? error.message : "Could not move the order.",
      );
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || !isValidStatus(String(over.id))) {
      return;
    }

    const order = active.data.current?.order as AdminOrderSummary | undefined;
    if (!order || order.status === over.id) {
      return;
    }

    void moveOrder(order.id, over.id as OrderStatus);
  }

  function handleCancel(order: AdminOrderSummary) {
    void moveOrder(order.id, "cancelled");
  }

  function handleViewDetail(order: AdminOrderSummary) {
    window.location.assign(`/operations/orders/${order.id}`);
  }

  return (
    <div className="flex flex-col gap-4">
      <OpsBoardToolbar
        search={search}
        onSearchChange={setSearch}
        range={range}
        onRangeChange={setRange}
      />

      <OpsCancelledBadge count={cancelledCount} />

      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {BOARD_COLUMNS.map((column) => (
            <OpsBoardColumn
              key={column.status}
              status={column.status}
              label={column.label}
              orders={ordersByStatus.get(column.status) ?? []}
              onCancel={handleCancel}
              onViewDetail={handleViewDetail}
            />
          ))}
        </div>
      </DndContext>
    </div>
  );
}

export default OpsBoard;
