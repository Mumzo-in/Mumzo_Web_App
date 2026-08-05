import { discountPct, isLowStock, type Product } from "@mumzo/schema";
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
import { Badge } from "@mumzo/ui/components/badge";
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
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { queryKeys } from "@/core/api/query-keys";
import { usePaginatedList } from "@/core/api/use-paginated-list";
import DataTable from "@/core/components/data-table";
import { formatMoney, formatNumber } from "@/core/components/format";
import StatusChip from "@/core/components/status-chip";
import { usePermission } from "@/modules/roles";
import { deleteProduct, listProducts } from "../api/products-api";
import { PRODUCT_STATUS_META } from "../data/product-data";

const STATUS_FILTERS = [
  { value: "all", label: "All statuses" },
  { value: "active", label: "Active" },
  { value: "draft", label: "Draft" },
  { value: "archived", label: "Archived" },
] as const;

export function ProductTable() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("all");
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
          <div className="flex flex-col gap-0.5">
            <span className="font-medium">{row.original.name}</span>
            <span className="numeric text-muted-foreground text-xs">
              {row.original.sku} · {row.original.brand}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "categorySlug",
        header: "Category",
        enableSorting: false,
        cell: ({ row }) => (
          <Badge variant="outline" className="rounded-full">
            {row.original.categorySlug}
          </Badge>
        ),
      },
      {
        accessorKey: "price",
        header: "Price",
        cell: ({ row }) => {
          const off = discountPct(row.original);
          return (
            <div className="flex flex-col gap-0.5">
              <span className="numeric font-medium">
                {formatMoney(row.original.price)}
              </span>
              {off > 0 ? (
                <span className="numeric text-muted-foreground text-xs line-through">
                  {formatMoney(row.original.mrp)}
                </span>
              ) : null}
            </div>
          );
        },
      },
      {
        accessorKey: "stock",
        header: "Stock",
        cell: ({ row }) => {
          const { stock } = row.original;
          if (stock === 0) {
            return (
              <StatusChip
                label="Out of stock"
                tint="bg-destructive/10 text-destructive"
              />
            );
          }
          if (isLowStock(row.original)) {
            return (
              <StatusChip
                label={`Low · ${stock}`}
                tint="bg-accent text-accent-foreground"
              />
            );
          }
          return <span className="numeric">{formatNumber(stock)}</span>;
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const meta = PRODUCT_STATUS_META[row.original.status];
          return <StatusChip label={meta.label} tint={meta.tint} />;
        },
      },
      ...(canDelete
        ? [
            {
              id: "actions",
              header: "",
              enableSorting: false,
              cell: ({ row }: { row: { original: Product } }) => (
                <div className="flex justify-end">
                  <Button
                    className="hover:border-destructive/20 hover:bg-destructive/10 hover:text-destructive"
                    data-testid={`admin-product-delete-${row.original.id}`}
                    onClick={(event) => {
                      event.stopPropagation();
                      setPendingDelete({
                        id: row.original.id,
                        name: row.original.name,
                      });
                    }}
                    size="icon-sm"
                    variant="outline"
                  >
                    <Trash2 aria-hidden="true" className="size-3.5" />
                  </Button>
                </div>
              ),
            } satisfies ColumnDef<Product, unknown>,
          ]
        : []),
    ],
    [canDelete],
  );

  const filters = useMemo(
    () => ({
      search: search || undefined,
      status: status === "all" ? undefined : status,
    }),
    [search, status],
  );

  const list = usePaginatedList({
    queryKey: queryKeys.products.lists(),
    fetcher: listProducts,
    columns,
    filters,
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="Search name, SKU or brand…"
          className="max-w-xs"
          value={search}
          data-testid="admin-products-search"
          onChange={(event) => {
            setSearch(event.target.value);
            list.resetToFirstPage();
          }}
        />
        <Select
          value={status}
          onValueChange={(value) => {
            setStatus(String(value));
            list.resetToFirstPage();
          }}
        >
          <SelectTrigger className="w-44" data-testid="admin-products-status">
            <SelectValue />
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
        table={list.table}
        meta={list.meta}
        isLoading={list.isLoading}
        isFetching={list.isFetching}
        error={list.error}
        hasNext={list.hasNext}
        hasPrev={list.hasPrev}
        page={list.page}
        onPageChange={list.setPage}
        testId="admin-products-table"
        emptyTitle="No products found"
        emptyDescription="Try a different search or filter."
        onRowClick={(product) =>
          navigate({
            to: "/catalog/products/$productId",
            params: { productId: product.id },
          })
        }
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
              {pendingDelete?.name} will be permanently removed. This cannot be
              undone.
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
