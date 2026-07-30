import { Input } from "@mumzo/ui/components/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@mumzo/ui/components/select";
import type { ColumnDef } from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { queryKeys } from "@/core/api/query-keys";
import { usePaginatedList } from "@/core/api/use-paginated-list";
import DataTable from "@/core/components/data-table";
import { formatDateTime, formatMoney } from "@/core/components/format";
import StatusChip from "@/core/components/status-chip";
import { listOrders } from "../api/orders-api";
import {
  type AdminOrderSummary,
  isSlaBreached,
  ORDER_STATUS_META,
  PAYMENT_METHOD_LABELS,
} from "../data/order-data";

const STATUS_FILTERS = [
  { value: "all", label: "All statuses" },
  { value: "confirmed", label: "Order placed" },
  { value: "packed", label: "Packed" },
  { value: "shipped", label: "Shipped" },
  { value: "out_for_delivery", label: "Out for delivery" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
  { value: "return_requested", label: "Return requested" },
  { value: "returned", label: "Returned" },
] as const;

export function OrderTable() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("all");

  const columns = useMemo<ColumnDef<AdminOrderSummary, unknown>[]>(
    () => [
      {
        accessorKey: "id",
        header: "Order",
        cell: ({ row }) => (
          <div className="flex flex-col gap-0.5">
            <span className="numeric font-medium">
              #{row.original.id.slice(0, 8).toUpperCase()}
            </span>
            <span className="text-muted-foreground text-xs">
              {row.original.itemCount} item
              {row.original.itemCount === 1 ? "" : "s"} · {row.original.hubName}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "customerName",
        header: "Customer",
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const meta = ORDER_STATUS_META[row.original.status];
          return (
            <div className="flex items-center gap-2">
              <StatusChip label={meta.label} tint={meta.tint} />
              {isSlaBreached(row.original) ? (
                <StatusChip
                  label="SLA breach"
                  tint="bg-destructive/10 text-destructive"
                />
              ) : null}
            </div>
          );
        },
      },
      {
        accessorKey: "paymentMethod",
        header: "Payment",
        enableSorting: false,
        cell: ({ row }) => (
          <span className="text-sm">
            {PAYMENT_METHOD_LABELS[row.original.paymentMethod] ??
              row.original.paymentMethod}
          </span>
        ),
      },
      {
        accessorKey: "total",
        header: "Total",
        cell: ({ row }) => (
          <span className="numeric font-medium">
            {formatMoney(row.original.total)}
          </span>
        ),
      },
      {
        accessorKey: "placedAt",
        header: "Placed",
        cell: ({ row }) => (
          <span className="numeric text-muted-foreground text-sm">
            {formatDateTime(row.original.placedAt)}
          </span>
        ),
      },
    ],
    [],
  );

  const filters = useMemo(
    () => ({
      search: search || undefined,
      status: status === "all" ? undefined : status,
    }),
    [search, status],
  );

  const list = usePaginatedList({
    queryKey: queryKeys.orders.lists(),
    fetcher: listOrders,
    columns,
    filters,
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="Search order, customer or hub…"
          className="max-w-xs"
          value={search}
          data-testid="admin-orders-search"
          onChange={(event) => {
            setSearch(event.target.value);
            list.resetToFirstPage();
          }}
        />
        <Select
          value={status}
          onValueChange={(value) => {
            setStatus(String(value));
            list.resetToFirstPage();
          }}
        >
          <SelectTrigger className="w-52" data-testid="admin-orders-status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {STATUS_FILTERS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      <DataTable
        table={list.table}
        meta={list.meta}
        isLoading={list.isLoading}
        isFetching={list.isFetching}
        error={list.error}
        hasNext={list.hasNext}
        hasPrev={list.hasPrev}
        page={list.page}
        onPageChange={list.setPage}
        testId="admin-orders-table"
        emptyTitle="No orders found"
        emptyDescription="Try a different search or filter."
      />
    </div>
  );
}

export default OrderTable;
