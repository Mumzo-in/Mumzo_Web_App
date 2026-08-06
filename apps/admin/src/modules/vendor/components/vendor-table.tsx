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
import { Button } from "@mumzo/ui/components/button";
import { Input } from "@mumzo/ui/components/input";
import { Switch } from "@mumzo/ui/components/switch";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { queryKeys } from "@/core/api/query-keys";
import { usePaginatedList } from "@/core/api/use-paginated-list";
import DataTable from "@/core/components/data-table";
import { formatNumber } from "@/core/components/format";
import { usePermission } from "@/modules/roles";
import {
  deleteVendor,
  listVendors,
  updateVendor,
  type Vendor,
} from "../api/vendors-api";
import { VENDOR_TYPE_LABEL } from "../data/vendor-data";

export function VendorTable() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const canWrite = usePermission("vendor", "update");
  const canDelete = usePermission("vendor", "delete");
  const [pendingDelete, setPendingDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteVendor(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.vendors.all });
      setPendingDelete(null);
      toast.success("Vendor deleted.");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Could not delete the vendor.");
      setPendingDelete(null);
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      updateVendor(id, { isActive }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.vendors.all });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Could not update the vendor.");
    },
  });

  const columns = useMemo<ColumnDef<Vendor, unknown>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Vendor",
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-medium">{row.original.name}</span>
            <span className="text-muted-foreground text-xs">
              {row.original.slug}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "type",
        header: "Type",
        enableSorting: false,
        cell: ({ row }) => (
          <span className="text-muted-foreground text-xs">
            {VENDOR_TYPE_LABEL[row.original.type]}
          </span>
        ),
      },
      {
        accessorKey: "city",
        header: "City",
        enableSorting: false,
        cell: ({ row }) => (
          <span className="text-muted-foreground text-xs">
            {row.original.city ?? "—"}
          </span>
        ),
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
        id: "status",
        header: "Status",
        enableSorting: false,
        cell: ({ row }) => {
          const vendor = row.original;
          return (
            <div className="flex items-center gap-2">
              <Switch
                checked={vendor.isActive}
                data-testid={`admin-vendor-toggle-${vendor.id}`}
                disabled={!canWrite || toggleActiveMutation.isPending}
                onCheckedChange={(checked) => {
                  toggleActiveMutation.mutate({
                    id: vendor.id,
                    isActive: checked,
                  });
                }}
                onClick={(event) => event.stopPropagation()}
              />
              <span className="text-muted-foreground text-xs">
                {vendor.isActive ? "Active" : "Inactive"}
              </span>
            </div>
          );
        },
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        cell: ({ row }) => {
          const vendor = row.original;
          return (
            <div className="flex justify-end">
              <Button
                data-testid={`admin-vendor-view-${vendor.id}`}
                onClick={(event) => event.stopPropagation()}
                render={
                  <Link
                    params={{ vendorId: vendor.id }}
                    to="/catalog/vendors/$vendorId"
                  />
                }
                size="sm"
                variant="outline"
              >
                <Eye className="size-3.5" data-icon="inline-start" />
                View
              </Button>
              {canWrite ? (
                <Button
                  className="ml-2"
                  data-testid={`admin-vendor-edit-${vendor.id}`}
                  onClick={(event) => event.stopPropagation()}
                  render={
                    <Link
                      params={{ vendorId: vendor.id }}
                      to="/catalog/vendors/$vendorId/edit"
                    />
                  }
                  size="sm"
                  variant="outline"
                >
                  <Pencil className="size-3.5" data-icon="inline-start" />
                  Edit
                </Button>
              ) : null}
              {canDelete ? (
                <Button
                  className="ml-2 hover:border-destructive/20 hover:bg-destructive/10 hover:text-destructive"
                  disabled={deleteMutation.isPending || vendor.productCount > 0}
                  onClick={(event) => {
                    event.stopPropagation();
                    setPendingDelete({ id: vendor.id, name: vendor.name });
                  }}
                  size="sm"
                  title={
                    vendor.productCount > 0
                      ? "Reassign its products before deleting."
                      : undefined
                  }
                  variant="outline"
                >
                  <Trash2 className="size-3.5" data-icon="inline-start" />
                  Delete
                </Button>
              ) : null}
            </div>
          );
        },
      },
    ],
    [
      canWrite,
      canDelete,
      deleteMutation.isPending,
      toggleActiveMutation.isPending,
      toggleActiveMutation.mutate,
    ],
  );

  const filters = useMemo(() => ({ search: search || undefined }), [search]);

  const list = usePaginatedList({
    queryKey: queryKeys.vendors.lists(),
    fetcher: listVendors,
    columns,
    filters,
    initialLimit: 10,
  });

  return (
    <div className="flex flex-col gap-4">
      <Input
        className="max-w-xs"
        data-testid="admin-vendors-search"
        onChange={(event) => {
          setSearch(event.target.value);
          list.resetToFirstPage();
        }}
        placeholder="Search vendors…"
        value={search}
      />

      <DataTable
        emptyDescription="Add a vendor to start sourcing products from them."
        emptyTitle="No vendors yet"
        error={list.error}
        hasNext={list.hasNext}
        hasPrev={list.hasPrev}
        isFetching={list.isFetching}
        isLoading={list.isLoading}
        meta={list.meta}
        onPageChange={list.setPage}
        onPageSizeChange={(size) => {
          list.setLimit(size);
          list.resetToFirstPage();
        }}
        page={list.page}
        pageSize={list.limit}
        table={list.table}
        testId="admin-vendors-table"
      />

      <AlertDialog
        onOpenChange={(open) => {
          if (!open) {
            setPendingDelete(null);
          }
        }}
        open={pendingDelete !== null}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this vendor?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete?.name} will be removed from the directory. This
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteMutation.isPending}
              onClick={() => {
                if (pendingDelete) {
                  deleteMutation.mutate(pendingDelete.id);
                }
              }}
            >
              {deleteMutation.isPending ? "Deleting…" : "Delete vendor"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default VendorTable;
