import { Input } from "@mumzo/ui/components/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@mumzo/ui/components/select";
import { getRouteApi } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { useMemo } from "react";
import { queryKeys } from "@/core/api/query-keys";
import { usePaginatedList } from "@/core/api/use-paginated-list";
import DataTable from "@/core/components/data-table";
import { formatDate, formatMoney } from "@/core/components/format";
import StatusChip from "@/core/components/status-chip";
import { listReferralCoupons } from "../api/referrals-api";
import {
  COUPON_STATUS_META,
  type ReferralCoupon,
  type ReferralCouponStatus,
} from "../data/referral-data";

const routeApi = getRouteApi("/(admin)/marketing/referrals/coupons");

const STATUS_FILTERS: { value: ReferralCouponStatus | "all"; label: string }[] =
  [
    { value: "all", label: "All statuses" },
    { value: "active", label: "Active" },
    { value: "used", label: "Used" },
    { value: "expired", label: "Expired" },
    { value: "revoked", label: "Revoked" },
  ];

/** Every coupon ever issued as a referral reward, across all referrers. */
export function CouponsTable() {
  const search = routeApi.useSearch();
  const navigate = routeApi.useNavigate();

  const columns = useMemo<ColumnDef<ReferralCoupon, unknown>[]>(
    () => [
      {
        accessorKey: "code",
        header: "Code",
        enableSorting: false,
        cell: ({ row }) => (
          <span className="numeric font-medium">{row.original.code}</span>
        ),
      },
      {
        accessorKey: "referrerName",
        header: "Referrer",
        enableSorting: false,
        cell: ({ row }) => (
          <span className="text-sm">{row.original.referrerName}</span>
        ),
      },
      {
        accessorKey: "amount",
        header: "Amount",
        enableSorting: false,
        cell: ({ row }) => (
          <span className="numeric font-medium">
            {formatMoney(row.original.amount)}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        enableSorting: false,
        cell: ({ row }) => {
          const meta = COUPON_STATUS_META[row.original.status];
          return <StatusChip label={meta.label} tint={meta.tint} />;
        },
      },
      {
        accessorKey: "issuedAt",
        header: "Issued",
        enableSorting: false,
        cell: ({ row }) => (
          <span className="numeric text-muted-foreground text-sm">
            {formatDate(row.original.issuedAt)}
          </span>
        ),
      },
      {
        accessorKey: "expiresAt",
        header: "Expires",
        enableSorting: false,
        cell: ({ row }) => (
          <span className="numeric text-muted-foreground text-sm">
            {formatDate(row.original.expiresAt)}
          </span>
        ),
      },
      {
        accessorKey: "usedInOrderId",
        header: "Used in order",
        enableSorting: false,
        cell: ({ row }) => (
          <span className="numeric text-sm">
            {row.original.usedInOrderId ?? "—"}
          </span>
        ),
      },
    ],
    [],
  );

  const filters = useMemo(
    () => ({
      search: search.q || undefined,
      status: search.status === "all" ? undefined : search.status,
    }),
    [search.q, search.status],
  );

  const list = usePaginatedList({
    queryKey: queryKeys.referrals.coupons.lists(),
    fetcher: listReferralCoupons,
    columns,
    filters,
    page: search.page,
    onPageChange: (page) => navigate({ search: (prev) => ({ ...prev, page }) }),
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <Input
          className="max-w-xs border-border bg-card"
          data-testid="admin-referral-coupons-search"
          onChange={(event) => {
            const q = event.target.value;
            navigate({ search: (prev) => ({ ...prev, q, page: 1 }) });
          }}
          placeholder="Search code or referrer…"
          value={search.q}
        />
        <Select
          onValueChange={(value) => {
            navigate({
              search: (prev) => ({
                ...prev,
                status: value as ReferralCouponStatus | "all",
                page: 1,
              }),
            });
          }}
          value={search.status}
        >
          <SelectTrigger
            className="w-44 border-border bg-card"
            data-testid="admin-referral-coupons-status"
          >
            <SelectValue>
              {STATUS_FILTERS.find((s) => s.value === search.status)?.label}
            </SelectValue>
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
        emptyDescription="Try a different search or filter."
        emptyTitle="No coupons found"
        error={list.error}
        hasNext={list.hasNext}
        hasPrev={list.hasPrev}
        isFetching={list.isFetching}
        isLoading={list.isLoading}
        meta={list.meta}
        onPageChange={(page) =>
          navigate({ search: (prev) => ({ ...prev, page }) })
        }
        page={list.page}
        table={list.table}
        testId="admin-referral-coupons-table"
      />
    </div>
  );
}

export default CouponsTable;
