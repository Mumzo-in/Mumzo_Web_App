import { Badge } from "@mumzo/ui/components/badge";
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

import type { NotificationLogEntry } from "../api/notifications-api";

type DeliveryLogProps = {
  logs: NotificationLogEntry[] | undefined;
  isLoading: boolean;
};

export function DeliveryLog({ logs, isLoading }: DeliveryLogProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (!logs || logs.length === 0) {
    return (
      <Empty data-testid="logs-empty">
        <EmptyHeader>
          <EmptyTitle>Nothing sent yet</EmptyTitle>
          <EmptyDescription>
            Delivery attempts appear here as soon as a notification is sent.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-muted-foreground text-sm">
        <strong>sent</strong> means the provider accepted the message — actual
        receipt on the device is only ever confirmed by a delivery receipt,
        which FCM does not send back synchronously.
      </p>
      <div className="overflow-x-auto">
        <Table data-testid="logs-table">
          <TableHeader>
            <TableRow>
              <TableHead>When</TableHead>
              <TableHead>Template</TableHead>
              <TableHead>App</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Detail</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell className="text-muted-foreground text-xs">
                  {new Date(entry.createdAt).toLocaleTimeString()}
                </TableCell>
                <TableCell className="font-mono text-xs">
                  {entry.templateId}
                </TableCell>
                <TableCell>{entry.app}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      entry.status === "sent" || entry.status === "delivered"
                        ? "default"
                        : "destructive"
                    }
                  >
                    {entry.status}
                  </Badge>
                </TableCell>
                <TableCell className="max-w-[320px] truncate text-xs">
                  {entry.errorCode ? (
                    <span className="text-destructive">
                      {entry.errorCode}
                      {entry.error ? ` — ${entry.error}` : ""}
                    </span>
                  ) : (
                    <span className="font-mono text-muted-foreground">
                      {entry.providerMessageId?.split("/").pop() ?? "—"}
                    </span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
