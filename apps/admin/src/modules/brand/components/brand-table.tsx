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
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@mumzo/ui/components/avatar";
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
  type Brand,
  deleteBrand,
  listBrands,
  updateBrand,
} from "../api/brands-api";

export function BrandTable() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const canWrite = usePermission("brand", "update");
  const canDelete = usePermission("brand", "delete");
  const [pendingDelete, setPendingDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteBrand(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.brands.all });
      setPendingDelete(null);
      toast.success("Brand deleted.");
    },
    onError: (error: Error) => {
      // The server refuses when products still reference the brand.
      toast.error(error.message || "Could not delete the brand.");
      setPendingDelete(null);
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      updateBrand(id, { isActive }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.brands.all });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Could not update the brand.");
    },
  });

  const columns = useMemo<ColumnDef<Brand, unknown>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Brand",
        cell: ({ row }) => (
          <div className="flex items-center gap-2.5">
            <Avatar size="sm">
              {row.original.logoUrl ? (
                <AvatarImage alt="" src={row.original.logoUrl} />
              ) : null}
              <AvatarFallback>{row.original.name.slice(0, 2)}</AvatarFallback>
            </Avatar>
            <span className="font-medium">{row.original.name}</span>
          </div>
        ),
      },
      {
        accessorKey: "slug",
        header: "Slug",
        enableSorting: false,
        cell: ({ row }) => (
          <span className="text-muted-foreground text-xs">
            {row.original.slug}
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
          const brand = row.original;
          return (
            <div className="flex items-center gap-2">
              <Switch
                checked={brand.isActive}
                data-testid={`admin-brand-toggle-${brand.id}`}
                disabled={!canWrite || toggleActiveMutation.isPending}
                onCheckedChange={(checked) => {
                  toggleActiveMutation.mutate({
                    id: brand.id,
                    isActive: checked,
                  });
                }}
                onClick={(event) => event.stopPropagation()}
              />
              <span className="text-muted-foreground text-xs">
                {brand.isActive ? "Active" : "Inactive"}
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
          const brand = row.original;
          return (
            <div className="flex justify-end">
              <Button
                data-testid={`admin-brand-view-${brand.id}`}
                onClick={(event) => event.stopPropagation()}
                render={
                  <Link
                    params={{ brandId: brand.id }}
                    to="/catalog/brands/$brandId"
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
                  data-testid={`admin-brand-edit-${brand.id}`}
                  onClick={(event) => event.stopPropagation()}
                  render={
                    <Link
                      params={{ brandId: brand.id }}
                      to="/catalog/brands/$brandId/edit"
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
                  disabled={deleteMutation.isPending || brand.productCount > 0}
                  onClick={(event) => {
                    event.stopPropagation();
                    setPendingDelete({ id: brand.id, name: brand.name });
                  }}
                  size="sm"
                  title={
                    brand.productCount > 0
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
    queryKey: queryKeys.brands.lists(),
    fetcher: listBrands,
    columns,
    filters,
    initialLimit: 10,
  });

  return (
    <div className="flex flex-col gap-4">
      <Input
        className="max-w-xs"
        data-testid="admin-brands-search"
        onChange={(event) => {
          setSearch(event.target.value);
          list.resetToFirstPage();
        }}
        placeholder="Search brands…"
        value={search}
      />

      <DataTable
        emptyDescription="Create a brand to organize products under it."
        emptyTitle="No brands yet"
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
        testId="admin-brands-table"
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
            <AlertDialogTitle>Delete this brand?</AlertDialogTitle>
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
              {deleteMutation.isPending ? "Deleting…" : "Delete brand"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default BrandTable;
