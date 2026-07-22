import { Input } from "@mumzo/ui/components/input";
import { useNavigate } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { queryKeys } from "@/core/api/query-keys";
import { usePaginatedList } from "@/core/api/use-paginated-list";
import DataTable from "@/core/components/data-table";
import { formatNumber } from "@/core/components/format";
import StatusChip from "@/core/components/status-chip";
import { listVendors, type Vendor } from "../api/vendors-api";
import { VENDOR_TYPE_META } from "../data/vendor-data";

export function VendorTable() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const columns = useMemo<ColumnDef<Vendor, unknown>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Vendor",
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
        accessorKey: "type",
        header: "Type",
        enableSorting: false,
        cell: ({ row }) => VENDOR_TYPE_META[row.original.type].label,
      },
      {
        id: "contact",
        header: "Contact",
        enableSorting: false,
        cell: ({ row }) =>
          row.original.contactName ??
          row.original.phone ??
          row.original.email ??
          "—",
      },
      {
        accessorKey: "productCount",
        header: "Products",
        cell: ({ row }) => (
          <span className="numeric">
            {formatNumber(row.original.productCount)}
          </span>
        ),
      },
      {
        accessorKey: "isActive",
        header: "Status",
        cell: ({ row }) => (
          <StatusChip
            label={row.original.isActive ? "Active" : "Inactive"}
            tint={
              row.original.isActive
                ? "bg-sage text-ink"
                : "bg-secondary text-muted-foreground"
            }
          />
        ),
      },
    ],
    [],
  );

  const filters = useMemo(() => ({ search: search || undefined }), [search]);

  const list = usePaginatedList({
    queryKey: queryKeys.vendors.lists(),
    fetcher: listVendors,
    columns,
    filters,
  });

  return (
    <div className="flex flex-col gap-4">
      <Input
        placeholder="Search name or slug…"
        className="max-w-xs"
        value={search}
        data-testid="admin-vendors-search"
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
        testId="admin-vendors-table"
        emptyTitle="No vendors yet"
        emptyDescription="Add a vendor to source products from them."
        onRowClick={(vendor) =>
          navigate({
            to: "/catalog/vendors/$vendorId",
            params: { vendorId: vendor.id },
          })
        }
      />
    </div>
  );
}

export default VendorTable;
