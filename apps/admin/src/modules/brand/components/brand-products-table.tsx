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
import { formatMoney, formatNumber } from "@/core/components/format";
import { NeedsBackendNotice } from "@/core/components/needs-backend-notice";
import StatusChip from "@/core/components/status-chip";
import { brandProductsQueryOptions } from "../queries/brands";

const STATUS_TINT: Record<string, string> = {
  active: "bg-sage text-ink",
  draft: "bg-muted text-muted-foreground",
  inactive: "bg-accent text-ink",
  archived: "bg-secondary text-muted-foreground",
};

export function BrandProductsTable({ brandId }: { brandId: string }) {
  const { data, isLoading } = useQuery(brandProductsQueryOptions(brandId));
  const products = data ?? [];

  return (
    <div
      className="flex flex-col gap-3"
      data-testid="admin-brand-products-table"
    >
      <NeedsBackendNotice>
        This list reads local product fixtures — a real
        /admin/brands/:id/products endpoint hasn't been built yet.
      </NeedsBackendNotice>
      <div className="overflow-x-auto border border-border bg-card shadow-warm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Vendor</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-right">Stock</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={`ske-${i.toString()}`}>
                  <TableCell>
                    <Skeleton className="h-4 w-40" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Skeleton className="ml-auto h-4 w-14" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Skeleton className="ml-auto h-4 w-10" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6}>
                  <Empty>
                    <EmptyHeader>
                      <EmptyTitle>No products yet</EmptyTitle>
                      <EmptyDescription>
                        Products assigned to this brand will show up here.
                      </EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                </TableCell>
              </TableRow>
            ) : (
              products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {product.categorySlug}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {product.vendorName ?? "—"}
                  </TableCell>
                  <TableCell className="numeric text-right">
                    {formatMoney(product.price)}
                  </TableCell>
                  <TableCell className="numeric text-right">
                    {formatNumber(product.stock)}
                  </TableCell>
                  <TableCell>
                    <StatusChip
                      label={product.status}
                      tint={
                        STATUS_TINT[product.status] ??
                        "bg-secondary text-muted-foreground"
                      }
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export default BrandProductsTable;
