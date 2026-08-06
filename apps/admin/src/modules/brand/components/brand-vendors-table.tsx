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
import { formatNumber } from "@/core/components/format";
import { NeedsBackendNotice } from "@/core/components/needs-backend-notice";
import { brandVendorsQueryOptions } from "../queries/brands";

export function BrandVendorsTable({ brandId }: { brandId: string }) {
  const { data, isLoading } = useQuery(brandVendorsQueryOptions(brandId));
  const vendors = data ?? [];

  return (
    <div
      className="flex flex-col gap-3"
      data-testid="admin-brand-vendors-table"
    >
      <NeedsBackendNotice>
        This list reads local product fixtures — a real
        /admin/brands/:id/vendors endpoint hasn't been built yet.
      </NeedsBackendNotice>
      <div className="overflow-x-auto border border-border bg-card shadow-warm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vendor</TableHead>
              <TableHead className="text-right">Products supplied</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={`ske-${i.toString()}`}>
                  <TableCell>
                    <Skeleton className="h-4 w-32" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Skeleton className="ml-auto h-4 w-10" />
                  </TableCell>
                </TableRow>
              ))
            ) : vendors.length === 0 ? (
              <TableRow>
                <TableCell colSpan={2}>
                  <Empty>
                    <EmptyHeader>
                      <EmptyTitle>No vendors yet</EmptyTitle>
                      <EmptyDescription>
                        Vendors sourcing this brand's products will show up
                        here.
                      </EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                </TableCell>
              </TableRow>
            ) : (
              vendors.map((vendor) => (
                <TableRow key={vendor.vendorId}>
                  <TableCell className="font-medium">
                    {vendor.vendorName}
                  </TableCell>
                  <TableCell className="numeric text-right">
                    {formatNumber(vendor.productCount)}
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

export default BrandVendorsTable;
