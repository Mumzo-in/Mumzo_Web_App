import { Input } from "@mumzo/ui/components/input";
import type { ColumnDef } from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { queryKeys } from "@/core/api/query-keys";
import { usePaginatedList } from "@/core/api/use-paginated-list";
import DataTable from "@/core/components/data-table";
import { formatDateTime, formatMoney } from "@/core/components/format";
import StatusChip from "@/core/components/status-chip";
import { listFailedPayments, listPayments } from "../api/payments-api";
import {
  type AdminPayment,
  PAYMENT_STATUS_META,
  refundableAmount,
} from "../data/payment-data";

type PaymentTableProps = {
  /** The `/payments/failed` screen reuses this table with its own fetcher. */
  variant?: "all" | "failed";
};

export function PaymentTable({ variant = "all" }: PaymentTableProps) {
  const [search, setSearch] = useState("");

  const columns = useMemo<ColumnDef<AdminPayment, unknown>[]>(
    () => [
      {
        accessorKey: "gatewayRef",
        header: "Payment",
        cell: ({ row }) => (
          <div className="flex flex-col gap-0.5">
            <span className="numeric font-medium">
              {row.original.gatewayRef}
            </span>
            <span className="numeric text-muted-foreground text-xs">
              {row.original.orderReference} · {row.original.method}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "customerName",
        header: "Customer",
      },
      {
        accessorKey: "amount",
        header: "Amount",
        cell: ({ row }) => {
          const refundable = refundableAmount(row.original);
          return (
            <div className="flex flex-col gap-0.5">
              <span className="numeric font-medium">
                {formatMoney(row.original.amount)}
              </span>
              {row.original.refundedAmount > 0 ? (
                <span className="numeric text-muted-foreground text-xs">
                  {formatMoney(row.original.refundedAmount)} refunded
                  {refundable > 0 ? ` · ${formatMoney(refundable)} left` : ""}
                </span>
              ) : null}
            </div>
          );
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const meta = PAYMENT_STATUS_META[row.original.status];
          return (
            <div className="flex flex-col gap-1">
              <StatusChip label={meta.label} tint={meta.tint} />
              {row.original.failureReason ? (
                <span className="text-muted-foreground text-xs">
                  {row.original.failureReason}
                </span>
              ) : null}
            </div>
          );
        },
      },
      {
        accessorKey: "createdAt",
        header: "When",
        cell: ({ row }) => (
          <span className="numeric text-muted-foreground text-sm">
            {formatDateTime(row.original.createdAt)}
          </span>
        ),
      },
    ],
    [],
  );

  const filters = useMemo(() => ({ search: search || undefined }), [search]);

  const list = usePaginatedList({
    queryKey:
      variant === "failed"
        ? queryKeys.payments.failed()
        : queryKeys.payments.lists(),
    fetcher: variant === "failed" ? listFailedPayments : listPayments,
    columns,
    filters,
  });

  return (
    <div className="flex flex-col gap-4">
      <Input
        placeholder="Search gateway ref, order or customer…"
        className="max-w-sm"
        value={search}
        data-testid="admin-payments-search"
        onChange={(event) => {
          setSearch(event.target.value);
          list.resetToFirstPage();
        }}
      />

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
        testId="admin-payments-table"
        emptyTitle="No payments found"
        emptyDescription="Try a different search."
      />
    </div>
  );
}

export default PaymentTable;
