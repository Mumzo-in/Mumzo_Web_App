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
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { queryKeys } from "@/core/api/query-keys";
import { formatNumber } from "@/core/components/format";
import PageHeader from "@/core/components/page-header";
import StatusChip from "@/core/components/status-chip";
import {
  AdjustInventoryDialog,
  inventoryQueryOptions,
} from "@/modules/operations/inventory";
import { getProduct } from "@/modules/operations/products";
import { usePermission } from "@/modules/roles";

export const Route = createFileRoute(
  "/(admin)/catalog/products/$productId/stock",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { productId } = Route.useParams();
  const canAdjust = usePermission("inventory", "adjust");

  const product = useQuery({
    queryKey: queryKeys.products.detail(productId),
    queryFn: () => getProduct(productId),
  });

  const inventory = useQuery(inventoryQueryOptions());
  const rows = (inventory.data ?? []).filter(
    (row) => row.productId === productId,
  );

  return (
    <>
      <PageHeader
        description={
          product.data
            ? `${product.data.sku} · Stock on hand per hub.`
            : "Stock on hand per hub."
        }
        title="Update stock"
      />

      <div className="overflow-x-auto border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Hub</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Reorder point</TableHead>
              {canAdjust ? (
                <TableHead className="text-right">Actions</TableHead>
              ) : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {inventory.isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={`ske-${i.toString()}`}>
                  <TableCell>
                    <Skeleton className="h-4 w-28" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-16" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-12" />
                  </TableCell>
                  {canAdjust ? (
                    <TableCell className="text-right">
                      <Skeleton className="ml-auto h-8 w-20 rounded-lg" />
                    </TableCell>
                  ) : null}
                </TableRow>
              ))
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={canAdjust ? 4 : 3}>
                  <Empty>
                    <EmptyHeader>
                      <EmptyTitle>No stock recorded</EmptyTitle>
                      <EmptyDescription>
                        Adjust stock for a hub to start tracking this product.
                      </EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={`${row.hubId}-${row.productId}`}>
                  <TableCell>{row.hubName}</TableCell>
                  <TableCell>
                    {row.stock === 0 ? (
                      <StatusChip
                        label="Out of stock"
                        tint="bg-destructive/10 text-destructive"
                      />
                    ) : row.isLowStock ? (
                      <StatusChip
                        label={`Low · ${formatNumber(row.stock)}`}
                        tint="bg-accent text-accent-foreground"
                      />
                    ) : (
                      <span className="numeric">{formatNumber(row.stock)}</span>
                    )}
                  </TableCell>
                  <TableCell className="numeric text-muted-foreground">
                    {formatNumber(row.reorderPoint)}
                  </TableCell>
                  {canAdjust ? (
                    <TableCell className="text-right">
                      <AdjustInventoryDialog row={row} />
                    </TableCell>
                  ) : null}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {canAdjust ? (
        <div className="flex justify-end">
          <AdjustInventoryDialog defaultProductId={productId} />
        </div>
      ) : null}
    </>
  );
}
