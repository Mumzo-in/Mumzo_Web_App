import { Button } from "@mumzo/ui/components/button";
import { Input } from "@mumzo/ui/components/input";
import { getRouteApi, Link } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { Eye } from "lucide-react";
import { useMemo } from "react";
import { queryKeys } from "@/core/api/query-keys";
import { usePaginatedList } from "@/core/api/use-paginated-list";
import DataTable from "@/core/components/data-table";
import { formatDate } from "@/core/components/format";
import { listReferralParticipants } from "../api/referrals-api";
import type { ReferralParticipant } from "../data/referral-data";

const routeApi = getRouteApi("/(admin)/marketing/referrals/participants/");

/** "Who joined" — every referrer and their aggregate invite performance. */
export function ParticipantsTable() {
  const search = routeApi.useSearch();
  const navigate = routeApi.useNavigate();

  const columns = useMemo<ColumnDef<ReferralParticipant, unknown>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Referrer",
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex flex-col gap-0.5">
            <span className="font-medium text-foreground">
              {row.original.name}
            </span>
            <span className="numeric text-muted-foreground text-xs">
              {row.original.code}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "totalReferred",
        header: "Referred",
        enableSorting: false,
        cell: ({ row }) => (
          <span className="numeric">{row.original.totalReferred}</span>
        ),
      },
      {
        accessorKey: "successfulReferrals",
        header: "Successful",
        enableSorting: false,
        cell: ({ row }) => (
          <span className="numeric font-medium">
            {row.original.successfulReferrals}
          </span>
        ),
      },
      {
        accessorKey: "currentTierName",
        header: "Tier",
        enableSorting: false,
        cell: ({ row }) => (
          <span className="text-sm">{row.original.currentTierName ?? "—"}</span>
        ),
      },
      {
        accessorKey: "couponsIssued",
        header: "Coupons",
        enableSorting: false,
        cell: ({ row }) => (
          <span className="numeric">{row.original.couponsIssued}</span>
        ),
      },
      {
        accessorKey: "joinedAt",
        header: "Joined",
        enableSorting: false,
        cell: ({ row }) => (
          <span className="numeric text-muted-foreground text-sm">
            {formatDate(row.original.joinedAt)}
          </span>
        ),
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex justify-end">
            <Button
              data-testid={`admin-referral-participant-view-${row.original.id}`}
              onClick={(event) => event.stopPropagation()}
              render={
                <Link
                  params={{ participantId: row.original.id }}
                  to="/marketing/referrals/participants/$participantId"
                />
              }
              size="sm"
              variant="outline"
            >
              <Eye className="size-3.5" data-icon="inline-start" />
              View
            </Button>
          </div>
        ),
      },
    ],
    [],
  );

  const filters = useMemo(
    () => ({ search: search.q || undefined }),
    [search.q],
  );

  const list = usePaginatedList({
    queryKey: queryKeys.referrals.participants.lists(),
    fetcher: listReferralParticipants,
    columns,
    filters,
    page: search.page,
    onPageChange: (page) => navigate({ search: (prev) => ({ ...prev, page }) }),
  });

  return (
    <div className="flex flex-col gap-4">
      <Input
        className="max-w-xs border-border bg-card"
        data-testid="admin-referral-participants-search"
        onChange={(event) => {
          const q = event.target.value;
          navigate({ search: (prev) => ({ ...prev, q, page: 1 }) });
        }}
        placeholder="Search name or code…"
        value={search.q}
      />

      <DataTable
        emptyDescription="Try a different search."
        emptyTitle="No referrers found"
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
        testId="admin-referral-participants-table"
      />
    </div>
  );
}

export default ParticipantsTable;
