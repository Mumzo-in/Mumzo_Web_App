import { Button } from "@mumzo/ui/components/button";
import { Input } from "@mumzo/ui/components/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@mumzo/ui/components/select";
import { getRouteApi, Link } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { Eye } from "lucide-react";
import { useMemo } from "react";
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
  ACTIVE_USER_SORT_PRESETS,
  type AdminUser,
  ageInMonths,
  isPlaceholderEmail,
  USER_SORT_PRESETS,
  USER_STATUS_META,
  type UserSortPreset,
} from "../data/user-data";

const routeApi = getRouteApi("/(admin)/platform/users/list");

export function UserTable() {
  const search = routeApi.useSearch();
  const navigate = routeApi.useNavigate();

  const columns = useMemo<ColumnDef<AdminUser, unknown>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Customer",
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex flex-col gap-0.5">
            <span className="font-medium text-foreground">
              {row.original.name}
            </span>
            {!isPlaceholderEmail(row.original.email) && (
              <span className="text-muted-foreground text-xs">
                {row.original.email}
              </span>
            )}
          </div>
        ),
      },
      {
        accessorKey: "phone",
        header: "Phone",
        enableSorting: false,
        cell: ({ row }) => (
          <span className="numeric text-foreground text-sm">
            {row.original.phone ?? "—"}
          </span>
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
        enableSorting: false,
        cell: ({ row }) => (
          <span className="numeric">
            {formatNumber(row.original.orderCount)}
          </span>
        ),
      },
      {
        accessorKey: "lifetimeValue",
        header: "Lifetime value",
        enableSorting: false,
        cell: ({ row }) => (
          <span className="numeric font-medium">
            {formatMoney(row.original.lifetimeValue)}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        enableSorting: false,
        cell: ({ row }) => {
          const meta = USER_STATUS_META[row.original.status];
          return <StatusChip label={meta.label} tint={meta.tint} />;
        },
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
        cell: ({ row }) => {
          const customer = row.original;
          return (
            <div className="flex justify-end">
              <Button
                data-testid={`admin-user-view-${customer.id}`}
                onClick={(event) => event.stopPropagation()}
                render={
                  <Link
                    params={{ userId: customer.id }}
                    to="/platform/users/$userId"
                  />
                }
                size="sm"
                variant="outline"
              >
                <Eye className="size-3.5" data-icon="inline-start" />
                View
              </Button>
            </div>
          );
        },
      },
    ],
    [],
  );

  const preset = USER_SORT_PRESETS[search.sort];
  const filters = useMemo(
    () => ({
      search: search.q || undefined,
      sortBy: preset.sortBy,
      sortDir: preset.sortDir,
    }),
    [search.q, preset],
  );

  const list = usePaginatedList({
    queryKey: queryKeys.users.lists(),
    fetcher: listUsers,
    columns,
    filters,
    page: search.page,
    onPageChange: (page) => navigate({ search: (prev) => ({ ...prev, page }) }),
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="Search name, email or phone…"
          className="max-w-xs border-border bg-card"
          value={search.q}
          data-testid="admin-users-search"
          onChange={(event) => {
            const q = event.target.value;
            navigate({ search: (prev) => ({ ...prev, q, page: 1 }) });
          }}
        />
        <Select
          value={search.sort}
          onValueChange={(value) => {
            navigate({
              search: (prev) => ({
                ...prev,
                sort: value as UserSortPreset,
                page: 1,
              }),
            });
          }}
        >
          <SelectTrigger
            className="w-48 border-border bg-card"
            data-testid="admin-users-sort"
          >
            <SelectValue>{USER_SORT_PRESETS[search.sort].label}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {Object.entries(USER_SORT_PRESETS).map(([key, option]) => (
                <SelectItem
                  key={key}
                  value={key}
                  disabled={
                    !ACTIVE_USER_SORT_PRESETS.includes(key as UserSortPreset)
                  }
                >
                  {option.label}
                  {!ACTIVE_USER_SORT_PRESETS.includes(key as UserSortPreset) &&
                    " (needs order data)"}
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
        onPageChange={(page) =>
          navigate({ search: (prev) => ({ ...prev, page }) })
        }
        testId="admin-users-table"
        emptyTitle="No customers found"
        emptyDescription="Try a different search."
      />
    </div>
  );
}

export default UserTable;
