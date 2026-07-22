import { Badge } from "@mumzo/ui/components/badge";
import { Input } from "@mumzo/ui/components/input";
import { useNavigate } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { queryKeys } from "@/core/api/query-keys";
import { usePaginatedList } from "@/core/api/use-paginated-list";
import DataTable from "@/core/components/data-table";
import {
  formatDate,
  formatMoney,
  formatNumber,
} from "@/core/components/format";
import StatusChip from "@/core/components/status-chip";
import { type Coupon, listCoupons } from "../api/coupons-api";
import { couponState } from "../data/coupon-data";

function describeValue(coupon: Coupon): string {
  if (coupon.type === "flat") {
    return `${formatMoney(coupon.value)} off`;
  }
  const cap = coupon.cap ? ` (max ${formatMoney(coupon.cap)})` : "";
  return `${coupon.value}% off${cap}`;
}

export function CouponTable() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const columns = useMemo<ColumnDef<Coupon, unknown>[]>(
    () => [
      {
        accessorKey: "code",
        header: "Code",
        cell: ({ row }) => (
          <div className="flex flex-col gap-1">
            <span className="numeric font-medium">{row.original.code}</span>
            <div className="flex flex-wrap gap-1">
              {row.original.firstOrderOnly ? (
                <Badge variant="outline" className="rounded-full text-[10px]">
                  First order
                </Badge>
              ) : null}
              {row.original.categorySlug ? (
                <Badge variant="outline" className="rounded-full text-[10px]">
                  {row.original.categorySlug}
                </Badge>
              ) : null}
            </div>
          </div>
        ),
      },
      {
        id: "value",
        header: "Discount",
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex flex-col gap-0.5">
            <span className="numeric text-sm">
              {describeValue(row.original)}
            </span>
            <span className="numeric text-muted-foreground text-xs">
              Min {formatMoney(row.original.minAmt)}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "usedCount",
        header: "Used",
        cell: ({ row }) => (
          <span className="numeric">
            {formatNumber(row.original.usedCount)}
            {row.original.maxUses
              ? ` / ${formatNumber(row.original.maxUses)}`
              : ""}
          </span>
        ),
      },
      {
        accessorKey: "expiresAt",
        header: "Expires",
        cell: ({ row }) => (
          <span className="numeric text-muted-foreground text-sm">
            {formatDate(row.original.expiresAt)}
          </span>
        ),
      },
      {
        id: "state",
        header: "State",
        enableSorting: false,
        cell: ({ row }) => {
          const state = couponState(row.original);
          return <StatusChip label={state.label} tint={state.tint} />;
        },
      },
    ],
    [],
  );

  const filters = useMemo(() => ({ search: search || undefined }), [search]);

  const list = usePaginatedList({
    queryKey: queryKeys.coupons.lists(),
    fetcher: listCoupons,
    columns,
    filters,
  });

  return (
    <div className="flex flex-col gap-4">
      <Input
        placeholder="Search coupon code…"
        className="max-w-xs"
        value={search}
        data-testid="admin-coupons-search"
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
        testId="admin-coupons-table"
        emptyTitle="No coupons found"
        emptyDescription="Try a different search."
        onRowClick={(coupon) =>
          navigate({
            to: "/finance/coupons/$couponId",
            params: { couponId: coupon.id },
          })
        }
      />
    </div>
  );
}

export default CouponTable;
