import { Input } from "@mumzo/ui/components/input";
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
import { listUsers } from "../api/users-api";
import {
  type AdminUser,
  ageInMonths,
  USER_STATUS_META,
} from "../data/user-data";

export function UserTable() {
  const [search, setSearch] = useState("");

  const columns = useMemo<ColumnDef<AdminUser, unknown>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Customer",
        cell: ({ row }) => (
          <div className="flex flex-col gap-0.5">
            <span className="font-medium">{row.original.name}</span>
            <span className="text-muted-foreground text-xs">
              {row.original.email}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "phone",
        header: "Phone",
        enableSorting: false,
        cell: ({ row }) => (
          <span className="numeric text-sm">{row.original.phone}</span>
        ),
      },
      {
        id: "babies",
        header: "Babies",
        enableSorting: false,
        cell: ({ row }) => {
          const { babies } = row.original;
          if (babies.length === 0) {
            return <span className="text-muted-foreground text-sm">—</span>;
          }
          return (
            <div className="flex flex-col gap-0.5">
              {babies.map((baby) => (
                <span key={baby.dob} className="text-sm">
                  {baby.name}{" "}
                  <span className="numeric text-muted-foreground text-xs">
                    {ageInMonths(baby.dob)}m
                  </span>
                </span>
              ))}
            </div>
          );
        },
      },
      {
        accessorKey: "orderCount",
        header: "Orders",
        cell: ({ row }) => (
          <span className="numeric">
            {formatNumber(row.original.orderCount)}
          </span>
        ),
      },
      {
        accessorKey: "lifetimeValue",
        header: "Lifetime value",
        cell: ({ row }) => (
          <span className="numeric font-medium">
            {formatMoney(row.original.lifetimeValue)}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const meta = USER_STATUS_META[row.original.status];
          return <StatusChip label={meta.label} tint={meta.tint} />;
        },
      },
      {
        accessorKey: "joinedAt",
        header: "Joined",
        cell: ({ row }) => (
          <span className="numeric text-muted-foreground text-sm">
            {formatDate(row.original.joinedAt)}
          </span>
        ),
      },
    ],
    [],
  );

  const filters = useMemo(() => ({ search: search || undefined }), [search]);

  const list = usePaginatedList({
    queryKey: queryKeys.users.lists(),
    fetcher: listUsers,
    columns,
    filters,
  });

  return (
    <div className="flex flex-col gap-4">
      <Input
        placeholder="Search name, email or phone…"
        className="max-w-xs"
        value={search}
        data-testid="admin-users-search"
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
        testId="admin-users-table"
        emptyTitle="No customers found"
        emptyDescription="Try a different search."
      />
    </div>
  );
}

export default UserTable;
