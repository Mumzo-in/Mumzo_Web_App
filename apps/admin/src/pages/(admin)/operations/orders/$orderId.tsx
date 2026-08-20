import { Button } from "@mumzo/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@mumzo/ui/components/card";
import {
  Empty,
  EmptyDescription,
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
import { cn } from "@mumzo/ui/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { queryKeys } from "@/core/api/query-keys";
import { formatDateTime, formatMoney } from "@/core/components/format";
import PageHeader from "@/core/components/page-header";
import StatusChip from "@/core/components/status-chip";
import {
  type AdminOrderStatusLogEntry,
  getOrder,
  isSlaBreached,
  ORDER_FLOW,
  ORDER_STATUS_META,
  PAYMENT_METHOD_LABELS,
} from "@/modules/orders";

export const Route = createFileRoute("/(admin)/operations/orders/$orderId")({
  component: OrderDetailPage,
});

function OrderDetailPage() {
  const { orderId } = Route.useParams();
  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.orders.detail(orderId),
    queryFn: () => getOrder(orderId),
  });

  if (isLoading) {
    return <Skeleton className="h-64 rounded-2xl" />;
  }

  if (error || !data) {
    return (
      <PageHeader
        title="Order not found"
        description="This order doesn't exist."
      />
    );
  }

  const status = ORDER_STATUS_META[data.status];
  const breached = isSlaBreached(data);
  const isTerminalException =
    data.status === "cancelled" ||
    data.status === "return_requested" ||
    data.status === "returned";
  const flowStatus =
    data.status === "pending_payment" ? "confirmed" : data.status;
  const currentStep = ORDER_FLOW.indexOf(flowStatus);

  return (
    <>
      <PageHeader
        title={`#${data.id.slice(0, 8).toUpperCase()}`}
        description={`${data.customerName} · ${data.hubName}`}
        actions={
          <Button variant="outline" disabled data-testid="admin-order-refund">
            Refund
          </Button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="shadow-warm lg:col-span-2">
          <CardHeader>
            <CardTitle>Fulfilment</CardTitle>
            <CardDescription>
              {isTerminalException
                ? "This order exited the normal flow."
                : "Progress through the delivery stages."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isTerminalException ? (
              <StatusChip label={status.label} tint={status.tint} />
            ) : (
              <ol className="flex flex-col gap-3">
                {ORDER_FLOW.map((step, index) => {
                  const done = index <= currentStep;
                  const logEntry = data.statusLog.find(
                    (entry) => entry.toStatus === step,
                  );
                  return (
                    <li key={step} className="flex items-start gap-3">
                      <span
                        className={cn(
                          "flex size-6 shrink-0 items-center justify-center rounded-full border",
                          done
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border text-muted-foreground",
                        )}
                      >
                        {done ? <Check className="size-3" /> : null}
                      </span>
                      <div className="flex flex-1 flex-col gap-0.5">
                        <span
                          className={cn(
                            "text-sm",
                            done ? "font-medium" : "text-muted-foreground",
                          )}
                        >
                          {ORDER_STATUS_META[step].label}
                        </span>
                        {logEntry ? (
                          <span className="numeric text-muted-foreground text-xs">
                            {formatDateTime(logEntry.createdAt)} ·{" "}
                            {logEntry.actor}
                          </span>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-warm">
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Row label="Status">
              <StatusChip label={status.label} tint={status.tint} />
            </Row>
            {breached ? (
              <Row label="SLA">
                <StatusChip
                  label="Breached"
                  tint="bg-destructive/10 text-destructive"
                />
              </Row>
            ) : null}
            <Row label="Total">
              <span className="numeric font-medium">
                {formatMoney(data.total)}
              </span>
            </Row>
            <Row label="Payment">
              <span className="text-sm">
                {PAYMENT_METHOD_LABELS[data.paymentMethod] ??
                  data.paymentMethod}
              </span>
            </Row>
            <Row label="Payment status">
              <span className="text-sm capitalize">{data.paymentStatus}</span>
            </Row>
            <Row label="Items">
              <span className="numeric text-sm">{data.items.length}</span>
            </Row>
            <Row label="Placed">
              <span className="numeric text-sm">
                {formatDateTime(data.placedAt)}
              </span>
            </Row>
          </CardContent>
        </Card>

        <Card className="shadow-warm lg:col-span-2">
          <CardHeader>
            <CardTitle>Order items</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Variant</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="text-foreground text-sm">
                      {item.name}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {item.variantLabel ?? "—"}
                    </TableCell>
                    <TableCell className="numeric text-right font-semibold text-foreground text-sm">
                      {item.qty}
                    </TableCell>
                    <TableCell className="numeric text-right text-sm">
                      {formatMoney(item.price)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="flex flex-col gap-2 border-border/60 border-t pt-3">
              <Row label="Subtotal">
                <span className="numeric text-sm">
                  {formatMoney(data.subtotal)}
                </span>
              </Row>
              <Row label="GST">
                <span className="numeric text-sm">
                  {formatMoney(data.gstAmount)}
                </span>
              </Row>
              <Row label="Delivery fee">
                <span className="numeric text-sm">
                  {formatMoney(data.deliveryFee)}
                </span>
              </Row>
              {data.discount > 0 ? (
                <Row label="Discount">
                  <span className="numeric text-sm">
                    -{formatMoney(data.discount)}
                  </span>
                </Row>
              ) : null}
              <Row label="Total">
                <span className="numeric font-medium">
                  {formatMoney(data.total)}
                </span>
              </Row>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-warm">
          <CardHeader>
            <CardTitle>Customer & delivery</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Row label="Customer">
              <span className="text-sm">{data.customerName}</span>
            </Row>
            <Row label="Hub">
              <span className="text-sm">{data.hubName}</span>
            </Row>
            <Row label="Address label">
              <span className="text-sm">{data.addressLabel}</span>
            </Row>
            <Row label="Contact">
              <span className="text-sm">
                {data.addressName} · {data.addressPhone}
              </span>
            </Row>
            <div className="flex flex-col gap-1 border-border/60 border-t pt-3">
              <span className="text-muted-foreground text-xs">Address</span>
              <span className="text-sm">
                {data.addressLine1}
                {data.addressLine2 ? `, ${data.addressLine2}` : ""}
              </span>
              {data.addressLandmark ? (
                <span className="text-muted-foreground text-xs">
                  Near {data.addressLandmark}
                </span>
              ) : null}
              <span className="text-sm">
                {data.addressCity} {data.addressPincode}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-warm lg:col-span-3">
          <CardHeader>
            <CardTitle>Activity log</CardTitle>
            <CardDescription>
              Every status change on this order, most recent first.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {data.statusLog.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No status changes recorded yet.
              </p>
            ) : (
              <ul className="flex flex-col gap-3">
                {[...data.statusLog]
                  .sort(
                    (a, b) =>
                      new Date(b.createdAt).getTime() -
                      new Date(a.createdAt).getTime(),
                  )
                  .map((entry) => (
                    <ActivityLogRow key={entry.id} entry={entry} />
                  ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-warm lg:col-span-3">
          <CardHeader>
            <CardTitle>Reviews</CardTitle>
          </CardHeader>
          <CardContent>
            <Empty>
              <EmptyTitle>Order reviews aren't available yet</EmptyTitle>
              <EmptyDescription>
                This needs to be built — there's no way yet to link a customer
                review to the order it was placed on.
              </EmptyDescription>
            </Empty>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function ActivityLogRow({ entry }: { entry: AdminOrderStatusLogEntry }) {
  const toLabel = ORDER_STATUS_META[entry.toStatus]?.label ?? entry.toStatus;
  const fromLabel = entry.fromStatus
    ? (ORDER_STATUS_META[entry.fromStatus]?.label ?? entry.fromStatus)
    : null;

  return (
    <li className="flex items-start justify-between gap-4 border-border/60 border-b pb-3 last:border-0 last:pb-0">
      <div className="flex flex-col gap-0.5">
        <span className="text-sm">
          {fromLabel ? `${fromLabel} → ${toLabel}` : toLabel}
        </span>
        <span className="text-muted-foreground text-xs">by {entry.actor}</span>
        {entry.note ? (
          <span className="text-muted-foreground text-xs italic">
            "{entry.note}"
          </span>
        ) : null}
      </div>
      <span className="numeric shrink-0 text-muted-foreground text-xs">
        {formatDateTime(entry.createdAt)}
      </span>
    </li>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-muted-foreground text-sm">{label}</span>
      {children}
    </div>
  );
}
