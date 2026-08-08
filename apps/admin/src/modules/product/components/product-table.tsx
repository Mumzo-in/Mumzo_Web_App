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
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { queryKeys } from "@/core/api/query-keys";
import { usePaginatedList } from "@/core/api/use-paginated-list";
import DataTable from "@/core/components/data-table";
import { formatMoney } from "@/core/components/format";
import StatusChip from "@/core/components/status-chip";
import { usePermission } from "@/modules/roles";
import { deleteProduct, listProducts, type Product } from "../api/products-api";
import { PRODUCT_STATUS_META } from "../data/product-data";

export function ProductTable({ stockFilter }: { stockFilter?: string }) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const canWrite = usePermission("product", "update");
  const canDelete = usePermission("product", "delete");
  const [pendingDelete, setPendingDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteProduct(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.products.all,
      });
      setPendingDelete(null);
      toast.success("Product deleted.");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Could not delete the product.");
      setPendingDelete(null);
    },
  });

  const columns = useMemo<ColumnDef<Product, unknown>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Product",
        cell: ({ row }) => (
          <div className="flex items-center gap-2.5">
            <Avatar className="rounded-lg" size="sm">
              {row.original.images[0] ? (
                <AvatarImage alt="" src={row.original.images[0]} />
              ) : null}
              <AvatarFallback>{row.original.name.slice(0, 2)}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="font-medium">{row.original.name}</span>
              <span className="text-muted-foreground text-xs">
                {row.original.sizes[0]?.sku ?? "—"}
              </span>
            </div>
          </div>
        ),
      },
      {
        accessorKey: "brand",
        header: "Brand",
        enableSorting: false,
        cell: ({ row }) => (
          <span className="text-sm">{row.original.brand}</span>
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
        accessorKey: "stock",
        header: "Stock",
        cell: ({ row }) => (
          <span className="numeric">{row.original.stock}</span>
        ),
      },
      {
        id: "status",
        header: "Status",
        enableSorting: false,
        cell: ({ row }) => {
          const meta = PRODUCT_STATUS_META[row.original.status];
          return <StatusChip label={meta.label} tint={meta.tint} />;
        },
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        cell: ({ row }) => {
          const product = row.original;
          return (
            <div className="flex justify-end">
              <Button
                data-testid={`admin-product-view-${product.id}`}
                onClick={(event) => event.stopPropagation()}
                render={
                  <Link
                    params={{ productId: product.id }}
                    to="/catalog/products/$productId/edit"
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
                  data-testid={`admin-product-edit-${product.id}`}
                  onClick={(event) => event.stopPropagation()}
                  render={
                    <Link
                      params={{ productId: product.id }}
                      to="/catalog/products/$productId/edit"
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
                  disabled={deleteMutation.isPending}
                  onClick={(event) => {
                    event.stopPropagation();
                    setPendingDelete({ id: product.id, name: product.name });
                  }}
                  size="sm"
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
    [canWrite, canDelete, deleteMutation.isPending],
  );

  const filters = useMemo(
    () => ({
      search: search || undefined,
      stock: stockFilter || undefined,
    }),
    [search, stockFilter],
  );

  const list = usePaginatedList({
    queryKey: queryKeys.products.lists(),
    fetcher: listProducts,
    columns,
    filters,
    initialLimit: 10,
  });

  return (
    <div className="flex flex-col gap-4">
      <Input
        className="max-w-xs"
        data-testid="admin-products-search"
        onChange={(event) => {
          setSearch(event.target.value);
          list.resetToFirstPage();
        }}
        placeholder="Search products…"
        value={search}
      />

      <DataTable
        emptyDescription="Create a product to see it here."
        emptyTitle="No products yet"
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
        testId="admin-products-table"
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
            <AlertDialogTitle>Delete this product?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete?.name} will be removed from the catalog. This
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
              {deleteMutation.isPending ? "Deleting…" : "Delete product"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default ProductTable;
