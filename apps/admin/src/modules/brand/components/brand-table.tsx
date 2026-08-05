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
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@mumzo/ui/components/empty";
import { Skeleton } from "@mumzo/ui/components/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@mumzo/ui/components/table";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { queryKeys } from "@/core/api/query-keys";
import { formatNumber } from "@/core/components/format";
import StatusChip from "@/core/components/status-chip";
import { usePermission } from "@/modules/roles";
import { deleteBrand } from "../api/brands-api";
import { brandsQueryOptions } from "../queries/brands";
import { BrandDialog } from "./brand-dialog";

export function BrandTable() {
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery(brandsQueryOptions);
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

  if (error) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyTitle>Failed to load brands</EmptyTitle>
          <EmptyDescription>
            {error instanceof Error ? error.message : "Something went wrong."}
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  const brands = data ?? [];

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-x-auto rounded-3xl border border-border bg-card shadow-warm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Brand</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Products</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={`ske-${i.toString()}`}>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <Skeleton className="size-6 rounded-full" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-12" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Skeleton className="ml-auto h-8 w-20 rounded-lg" />
                  </TableCell>
                </TableRow>
              ))
            ) : brands.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5}>
                  <Empty>
                    <EmptyHeader>
                      <EmptyTitle>No brands yet</EmptyTitle>
                      <EmptyDescription>
                        Create a brand to organize products under it.
                      </EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                </TableCell>
              </TableRow>
            ) : (
              brands.map((brand) => (
                <TableRow key={brand.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2.5">
                      <Avatar size="sm">
                        {brand.logoUrl && (
                          <AvatarImage alt="" src={brand.logoUrl} />
                        )}
                        <AvatarFallback>
                          {brand.name.slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      {brand.name}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {brand.slug}
                  </TableCell>
                  <TableCell className="numeric">
                    {formatNumber(brand.productCount)}
                  </TableCell>
                  <TableCell>
                    <StatusChip
                      label={brand.isActive ? "Active" : "Inactive"}
                      tint={
                        brand.isActive
                          ? "bg-sage text-ink"
                          : "bg-secondary text-muted-foreground"
                      }
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    {canWrite ? <BrandDialog brand={brand} /> : null}
                    {canDelete ? (
                      <Button
                        className="ml-2 hover:border-destructive/20 hover:bg-destructive/10 hover:text-destructive"
                        disabled={
                          deleteMutation.isPending || brand.productCount > 0
                        }
                        onClick={() =>
                          setPendingDelete({ id: brand.id, name: brand.name })
                        }
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
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

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
