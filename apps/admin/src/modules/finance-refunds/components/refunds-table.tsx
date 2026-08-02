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
import { Link } from "@tanstack/react-router";
import { formatDateTime, formatMoney } from "@/core/components/format";
import StatusChip from "@/core/components/status-chip";
import { refundsQueryOptions } from "../queries/refunds";

const STATUS_TINT: Record<string, string> = {
  pending: "bg-status-warning/10 text-status-warning",
  processed: "bg-sage text-ink",
  failed: "bg-destructive/10 text-destructive",
};

type RefundsTableProps = {
  status?: string;
};

export function RefundsTable({ status }: RefundsTableProps) {
  const { data, isLoading, error } = useQuery(refundsQueryOptions(status));

  if (error) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyTitle>Failed to load refunds</EmptyTitle>
          <EmptyDescription>
            {error instanceof Error ? error.message : "Something went wrong."}
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  const rows = data ?? [];

  return (
    <div className="overflow-x-auto border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Reason</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Requested</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={`ske-${i.toString()}`}>
                <TableCell>
                  <Skeleton className="h-4 w-24" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-32" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-16" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-40" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-16 rounded-full" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-24" />
                </TableCell>
              </TableRow>
            ))
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6}>
                <Empty>
                  <EmptyHeader>
                    <EmptyTitle>No refunds found</EmptyTitle>
                    <EmptyDescription>
                      {status
                        ? `No refunds with status "${status}".`
                        : "Nothing here yet."}
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="numeric font-medium">
                  <Link
                    to="/operations/orders/$orderId"
                    params={{ orderId: row.orderId }}
                    className="hover:underline"
                  >
                    #{row.orderId.slice(0, 8).toUpperCase()}
                  </Link>
                </TableCell>
                <TableCell className="text-sm">{row.customerName}</TableCell>
                <TableCell className="numeric font-medium">
                  {formatMoney(row.amount)}
                </TableCell>
                <TableCell className="text-muted-foreground text-xs">
                  {row.reason}
                </TableCell>
                <TableCell>
                  <StatusChip
                    label={row.status}
                    tint={
                      STATUS_TINT[row.status] ??
                      "bg-secondary text-muted-foreground"
                    }
                  />
                </TableCell>
                <TableCell className="numeric text-muted-foreground text-sm">
                  {formatDateTime(row.createdAt)}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

export default RefundsTable;
