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
import { formatDate, formatMoney } from "@/core/components/format";
import Loader from "@/core/components/loader";
import { NeedsBackendNotice } from "@/core/components/needs-backend-notice";
import type { InvoiceStatus } from "../data/vendor-invoice-data";
import { vendorInvoicesQueryOptions } from "../queries/vendors";

const STATUS_TINT: Record<InvoiceStatus, string> = {
  paid: "bg-sage text-ink",
  pending: "bg-secondary text-muted-foreground",
  overdue: "bg-destructive/10 text-destructive",
};

export function VendorInvoicesTable({ vendorId }: { vendorId: string }) {
  const { data, isLoading } = useQuery(vendorInvoicesQueryOptions(vendorId));

  if (isLoading) {
    return <Loader />;
  }

  const rows = data ?? [];

  return (
    <div className="flex flex-col gap-3">
      <NeedsBackendNotice>
        Reading from local fixtures — needs a real procurement/GRN admin module
        to source purchase invoices.
      </NeedsBackendNotice>

      {rows.length === 0 ? (
        <Empty data-testid="admin-vendor-invoices-empty">
          <EmptyHeader>
            <EmptyTitle>No invoices yet</EmptyTitle>
            <EmptyDescription>
              Purchase invoices billed by this vendor will show up here.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="overflow-x-auto border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice</TableHead>
                <TableHead>PO</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Issued</TableHead>
                <TableHead>Due</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">
                    {row.invoiceNumber}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {row.poNumber}
                  </TableCell>
                  <TableCell className="numeric">
                    {formatMoney(row.amount)}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {formatDate(row.issuedAt)}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {formatDate(row.dueAt)}
                  </TableCell>
                  <TableCell>
                    <Badge className={STATUS_TINT[row.status]}>
                      {row.status}
                    </Badge>
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

export default VendorInvoicesTable;
