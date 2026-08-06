import { Badge } from "@mumzo/ui/components/badge";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@mumzo/ui/components/empty";
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
import Loader from "@/core/components/loader";
import { vendorProductsQueryOptions } from "../queries/vendors";

export function VendorProductsTable({ vendorId }: { vendorId: string }) {
  const { data, isLoading } = useQuery(vendorProductsQueryOptions(vendorId));

  if (isLoading) {
    return <Loader />;
  }

  const rows = data ?? [];

  return (
    <div className="flex flex-col gap-3">
      {rows.length === 0 ? (
        <Empty data-testid="admin-vendor-products-empty">
          <EmptyHeader>
            <EmptyTitle>No products sourced yet</EmptyTitle>
            <EmptyDescription>
              Products assigned to this vendor will show up here.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="overflow-x-auto border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Cost price</TableHead>
                <TableHead>Lead time</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {row.name}
                      {row.isPrimary ? (
                        <Badge variant="secondary">Primary</Badge>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {row.categorySlug}
                  </TableCell>
                  <TableCell className="numeric">
                    {formatMoney(row.price)}
                  </TableCell>
                  <TableCell className="numeric">
                    {row.costPrice !== null ? formatMoney(row.costPrice) : "—"}
                  </TableCell>
                  <TableCell className="numeric">
                    {row.leadTimeDays !== null ? `${row.leadTimeDays}d` : "—"}
                  </TableCell>
                  <TableCell className="numeric">
                    {formatNumber(row.stock)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{row.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

export default VendorProductsTable;
