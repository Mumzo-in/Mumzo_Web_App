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
import { resolveDateRangePreset } from "@/core/components/date-range/date-range-presets";
import {
  type AdminOrder,
  listOrders,
  type OrderStatus,
  updateOrderStatus,
} from "@/modules/orders";
import { BOARD_COLUMNS, type BoardColumnStatus } from "../data/ops-board-data";
import NewOrderDialog from "./new-order-dialog";
import OpsBoardColumn from "./ops-board-column";
import OpsBoardToolbar from "./ops-board-toolbar";
import OpsCancelledBadge from "./ops-cancelled-badge";

const TODAY = resolveDateRangePreset("today").from;
/** Board polls rather than pushing — no websocket infra exists yet. */
const REFETCH_INTERVAL_MS = 20_000;

function isSameDay(iso: string, day: string): boolean {
  return iso.slice(0, 10) === day;
}

function isValidStatus(id: string): id is BoardColumnStatus {
  return BOARD_COLUMNS.some((column) => column.status === id);
}

export function OpsBoard() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [date, setDate] = useState(TODAY);

  const { data } = useQuery({
    queryKey: queryKeys.orders.list({ date }),
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
      if (!isSameDay(order.placedAt, date)) {
        return false;
      }
      if (!needle) {
        return true;
      }
      return (
        order.reference.toLowerCase().includes(needle) ||
        order.customerName.toLowerCase().includes(needle)
      );
    });
  }, [data, date, search]);

  const ordersByStatus = useMemo(() => {
    const map = new Map<BoardColumnStatus, AdminOrder[]>();
    for (const column of BOARD_COLUMNS) {
      map.set(
        column.status,
        ordersForDay.filter((order) => order.status === column.status),
      );
    }
    return map;
  }, [ordersForDay]);

  const cancelledCount = ordersForDay.filter(
    (order) => order.status === "cancelled",
  ).length;

  async function moveOrder(orderId: string, status: OrderStatus) {
    const previous = queryClient.getQueryData(queryKeys.orders.list({ date }));

    // Optimistic — the mock array is mutated synchronously by
    // `updateOrderStatus`, so the next refetch would show it anyway; this
    // just avoids the visual snap-back while that request is in flight.
    queryClient.setQueryData(
      queryKeys.orders.list({ date }),
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
      queryClient.setQueryData(queryKeys.orders.list({ date }), previous);
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

    const order = active.data.current?.order as AdminOrder | undefined;
    if (!order || order.status === over.id) {
      return;
    }

    void moveOrder(order.id, over.id as OrderStatus);
  }

  function handleCancel(order: AdminOrder) {
    void moveOrder(order.id, "cancelled");
  }

  function handleViewDetail(order: AdminOrder) {
    window.location.assign(`/operations/orders/${order.id}`);
  }

  return (
    <div className="flex flex-col gap-4">
      <OpsBoardToolbar
        search={search}
        onSearchChange={setSearch}
        date={date}
        onDateChange={setDate}
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

      <NewOrderDialog />
    </div>
  );
}

export default OpsBoard;
