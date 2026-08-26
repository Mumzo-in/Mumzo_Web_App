import {
  closestCorners,
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@mumzo/ui/components/alert-dialog";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { queryKeys } from "@/core/api/query-keys";
import type { DateRange } from "@/core/components/date-range/date-range-presets";
import { resolveDateRangePreset } from "@/core/components/date-range/date-range-presets";
import { DeliveryLinkDialog } from "@/modules/delivery";
import {
  type AdminOrderSummary,
  listOrders,
  type OrderStatus,
  updateOrderStatus,
} from "@/modules/orders";
import { type Rider, RiderPickerDialog } from "@/modules/riders";
import {
  BOARD_COLUMNS,
  type BoardColumnStatus,
  OPTIONAL_COLUMN_STATUSES,
} from "../data/ops-board-data";
import CancelOrderDialog from "./cancel-order-dialog";
import OpsBoardCard from "./ops-board-card";
import OpsBoardColumn from "./ops-board-column";
import OpsBoardToolbar from "./ops-board-toolbar";
import OpsCancelledBadge from "./ops-cancelled-badge";
import OrderDetailDialog from "./order-detail-dialog";

const DEFAULT_RANGE = resolveDateRangePreset("thisMonth");
/** Board polls rather than pushing — no websocket infra exists yet. */
const REFETCH_INTERVAL_MS = 20_000;
/** Stable empty-array reference for columns with no orders — a fresh `[]`
 * literal on every render defeats memoization downstream and was part of
 * a render-loop with `@dnd-kit`'s internal re-measurement. */
const EMPTY_ORDERS: AdminOrderSummary[] = [];

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
  const [range, setRange] = useState<DateRange>(DEFAULT_RANGE);
  const [detailOrderId, setDetailOrderId] = useState<string | null>(null);
  const [cancelOrder, setCancelOrder] = useState<AdminOrderSummary | null>(
    null,
  );
  const [activeOrder, setActiveOrder] = useState<AdminOrderSummary | null>(
    null,
  );
  /** Order whose delivery link is being shared — set when a move lands in
   * `out_for_delivery`, so ops is handed the rider link immediately. */
  const [linkOrder, setLinkOrder] = useState<AdminOrderSummary | null>(null);
  /** Dispatch staged behind the rider picker — `out_for_delivery` needs a
   * rider before the move can go through. */
  const [pendingDispatch, setPendingDispatch] =
    useState<AdminOrderSummary | null>(null);
  /** Staged forward move awaiting an explicit "are you sure" confirmation. */
  const [pendingMove, setPendingMove] = useState<{
    order: AdminOrderSummary;
    targetStatus: BoardColumnStatus;
  } | null>(null);

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

  const returnedCount = ordersForDay.filter(
    (order) =>
      order.status === "return_requested" || order.status === "returned",
  ).length;

  async function moveOrder(
    orderId: string,
    status: OrderStatus,
    note?: string,
    riderId?: string,
  ) {
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
      await updateOrderStatus(orderId, status, note, riderId);
    } catch (error) {
      queryClient.setQueryData(queryKeys.orders.list(range), previous);
      toast.error(
        error instanceof Error ? error.message : "Could not move the order.",
      );
    }
  }

  /** Resolves an `over.id` (a column status, or another card being hovered)
   * down to the column status it represents. */
  function resolveOverStatus(
    over: DragEndEvent["over"],
  ): BoardColumnStatus | null {
    if (!over) {
      return null;
    }
    if (isValidStatus(String(over.id))) {
      return String(over.id) as BoardColumnStatus;
    }
    const hoveredOrder = over.data.current?.order as
      | AdminOrderSummary
      | undefined;
    if (!hoveredOrder) {
      return null;
    }
    return hoveredOrder.status === "pending_payment"
      ? "confirmed"
      : (hoveredOrder.status as BoardColumnStatus);
  }

  function handleDragStart(event: DragStartEvent) {
    const order = event.active.data.current?.order as
      | AdminOrderSummary
      | undefined;
    setActiveOrder(order ?? null);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveOrder(null);
    const { active, over } = event;
    const targetStatus = resolveOverStatus(over);

    const order = active.data.current?.order as AdminOrderSummary | undefined;
    if (!order || !targetStatus || order.status === targetStatus) {
      return;
    }

    const originStatus =
      order.status === "pending_payment" ? "confirmed" : order.status;
    const originIndex = BOARD_COLUMNS.findIndex(
      (column) => column.status === originStatus,
    );
    const targetIndex = BOARD_COLUMNS.findIndex(
      (column) => column.status === targetStatus,
    );

    if (targetIndex < originIndex) {
      toast.error("Orders can't be moved backward on the board.");
      return;
    }

    if (targetStatus === "cancelled") {
      setCancelOrder(order);
      return;
    }

    // A forward drag may jump over optional steps only. Any *required* step
    // in between has to be walked through — mirrors ALLOWED_TRANSITIONS on
    // the server, which is the real gate.
    const skippedRequired = BOARD_COLUMNS.slice(
      originIndex + 1,
      targetIndex,
    ).filter(
      (column) =>
        column.status !== "cancelled" &&
        !OPTIONAL_COLUMN_STATUSES.includes(column.status),
    );

    if (skippedRequired.length > 0) {
      toast.error(
        `Move the order through ${skippedRequired
          .map((column) => `"${column.label}"`)
          .join(" and ")} first.`,
      );
      return;
    }

    setPendingMove({ order, targetStatus });
  }

  /** Optional columns a staged move jumps over — surfaced in the confirm
   * dialog so skipping a step is deliberate rather than accidental. */
  const skippedLabels = useMemo(() => {
    if (!pendingMove) {
      return [];
    }
    const originStatus =
      pendingMove.order.status === "pending_payment"
        ? "confirmed"
        : pendingMove.order.status;
    const originIndex = BOARD_COLUMNS.findIndex(
      (column) => column.status === originStatus,
    );
    const targetIndex = BOARD_COLUMNS.findIndex(
      (column) => column.status === pendingMove.targetStatus,
    );
    return BOARD_COLUMNS.slice(originIndex + 1, targetIndex)
      .filter((column) => OPTIONAL_COLUMN_STATUSES.includes(column.status))
      .map((column) => column.label);
  }, [pendingMove]);

  function handleConfirmMove() {
    if (!pendingMove) {
      return;
    }
    const { order, targetStatus } = pendingMove;
    setPendingMove(null);

    if (targetStatus === "out_for_delivery") {
      setPendingDispatch(order);
      return;
    }

    void moveOrder(order.id, targetStatus);
  }

  async function handleRiderChosen(rider: Rider) {
    const order = pendingDispatch;
    setPendingDispatch(null);
    if (!order) {
      return;
    }
    await moveOrder(order.id, "out_for_delivery", undefined, rider.id);
    setLinkOrder({ ...order, status: "out_for_delivery" });
  }

  function handleShareLink(order: AdminOrderSummary) {
    setLinkOrder(order);
  }

  function handleCancel(order: AdminOrderSummary) {
    setCancelOrder(order);
  }

  function handleConfirmCancel(order: AdminOrderSummary, reason: string) {
    void moveOrder(order.id, "cancelled", reason);
  }

  function handleViewDetail(order: AdminOrderSummary) {
    setDetailOrderId(order.id);
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col gap-4">
      <OpsBoardToolbar
        search={search}
        onSearchChange={setSearch}
        range={range}
        onRangeChange={setRange}
      />

      <OpsCancelledBadge count={returnedCount} />

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex min-h-0 flex-1 gap-4 overflow-x-auto pb-2">
          {BOARD_COLUMNS.map((column) => (
            <OpsBoardColumn
              key={column.status}
              status={column.status}
              label={column.label}
              optional={column.optional}
              orders={ordersByStatus.get(column.status) ?? EMPTY_ORDERS}
              onCancel={handleCancel}
              onViewDetail={handleViewDetail}
              onShareLink={handleShareLink}
            />
          ))}
        </div>

        <DragOverlay>
          {activeOrder ? (
            <OpsBoardCard
              order={activeOrder}
              onCancel={handleCancel}
              onViewDetail={handleViewDetail}
              onShareLink={handleShareLink}
              overlay
            />
          ) : null}
        </DragOverlay>
      </DndContext>

      <OrderDetailDialog
        orderId={detailOrderId}
        onOpenChange={(open) => {
          if (!open) setDetailOrderId(null);
        }}
      />

      <RiderPickerDialog
        open={pendingDispatch !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDispatch(null);
        }}
        onConfirm={(rider) => void handleRiderChosen(rider)}
        orderLabel={
          pendingDispatch
            ? `#${pendingDispatch.id.slice(0, 8).toUpperCase()}`
            : undefined
        }
      />

      <DeliveryLinkDialog
        order={linkOrder}
        onOpenChange={(open) => {
          if (!open) setLinkOrder(null);
        }}
      />

      <CancelOrderDialog
        order={cancelOrder}
        onOpenChange={(open) => {
          if (!open) setCancelOrder(null);
        }}
        onConfirm={handleConfirmCancel}
      />

      <AlertDialog
        open={pendingMove !== null}
        onOpenChange={(open) => {
          if (!open) setPendingMove(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Move order to "
              {BOARD_COLUMNS.find(
                (column) => column.status === pendingMove?.targetStatus,
              )?.label ?? pendingMove?.targetStatus}
              "?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingMove
                ? `Order #${pendingMove.order.id.slice(0, 8).toUpperCase()} will move to this step.${
                    skippedLabels.length > 0
                      ? ` ${skippedLabels.join(" and ")} will be skipped.`
                      : ""
                  } This can't be undone from here.`
                : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmMove}>
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default OpsBoard;
