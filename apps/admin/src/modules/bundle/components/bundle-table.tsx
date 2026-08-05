import type { Bundle } from "@mumzo/schema";
import { Input } from "@mumzo/ui/components/input";
import { useNavigate } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { queryKeys } from "@/core/api/query-keys";
import { usePaginatedList } from "@/core/api/use-paginated-list";
import DataTable from "@/core/components/data-table";
import { formatMoney } from "@/core/components/format";
import StatusChip from "@/core/components/status-chip";
import { listBundles } from "../api/bundles-api";
import { BUNDLE_STATUS_META } from "../data/bundle-data";

type BundleRow = Bundle & { itemCount: number };

export function BundleTable() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const columns = useMemo<ColumnDef<BundleRow, unknown>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Bundle",
        cell: ({ row }) => (
          <div className="flex flex-col gap-0.5">
            <span className="font-medium">{row.original.name}</span>
            <span className="numeric text-muted-foreground text-xs">
              {row.original.slug}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "itemCount",
        header: "Items",
        cell: ({ row }) => (
          <span className="numeric">{row.original.itemCount}</span>
        ),
      },
      {
        accessorKey: "price",
        header: "Price",
        cell: ({ row }) => (
          <span className="numeric">{formatMoney(row.original.price)}</span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const meta = BUNDLE_STATUS_META[row.original.status];
          return <StatusChip label={meta.label} tint={meta.tint} />;
        },
      },
    ],
    [],
  );

  const filters = useMemo(() => ({ search: search || undefined }), [search]);

  const list = usePaginatedList({
    queryKey: queryKeys.bundles.lists(),
    fetcher: listBundles,
    columns,
    filters,
  });

  return (
    <div className="flex flex-col gap-4">
      <Input
        className="max-w-xs"
        data-testid="admin-bundles-search"
        onChange={(event) => {
          setSearch(event.target.value);
          list.resetToFirstPage();
        }}
        placeholder="Search name or slug…"
        value={search}
      />

      <DataTable
        emptyDescription="Group products into a priced combo to see it here."
        emptyTitle="No bundles yet"
        error={list.error}
        hasNext={list.hasNext}
        hasPrev={list.hasPrev}
        isFetching={list.isFetching}
        isLoading={list.isLoading}
        meta={list.meta}
        onPageChange={list.setPage}
        onRowClick={(bundle) =>
          navigate({
            to: "/catalog/bundles/$bundleId",
            params: { bundleId: bundle.id },
          })
        }
        page={list.page}
        table={list.table}
        testId="admin-bundles-table"
      />
    </div>
  );
}

export default BundleTable;
