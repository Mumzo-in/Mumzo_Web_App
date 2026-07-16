import { Button } from "@mumzo/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@mumzo/ui/components/card";
import { Skeleton } from "@mumzo/ui/components/skeleton";
import { cn } from "@mumzo/ui/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { queryKeys } from "@/core/api/query-keys";
import { formatDateTime, formatMoney } from "@/core/components/format";
import PageHeader from "@/core/components/page-header";
import StatusChip from "@/core/components/status-chip";
import {
  getOrder,
  isSlaBreached,
  ORDER_FLOW,
  ORDER_STATUS_META,
  PAYMENT_MODE_LABELS,
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
  const currentStep = ORDER_FLOW.indexOf(data.status);

  return (
    <>
      <PageHeader
        title={data.reference}
        description={`${data.customerName} · ${data.hub}`}
        actions={
          <Button variant="outline" disabled data-testid="admin-order-refund">
            Refund
          </Button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="shadow-warm lg:col-span-2">
          <CardHeader>
            <CardTitle>Progress</CardTitle>
            <CardDescription>
              {data.status === "cancelled"
                ? "This order was cancelled."
                : "Fulfilment timeline."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {data.status === "cancelled" ? (
              <StatusChip label={status.label} tint={status.tint} />
            ) : (
              <ol className="flex flex-col gap-3">
                {ORDER_FLOW.map((step, index) => {
                  const done = index <= currentStep;
                  return (
                    <li key={step} className="flex items-center gap-3">
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
                      <span
                        className={cn(
                          "text-sm",
                          done ? "font-medium" : "text-muted-foreground",
                        )}
                      >
                        {ORDER_STATUS_META[step].label}
                      </span>
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
                {PAYMENT_MODE_LABELS[data.paymentMode]}
              </span>
            </Row>
            <Row label="Items">
              <span className="numeric text-sm">{data.itemCount}</span>
            </Row>
            <Row label="Placed">
              <span className="numeric text-sm">
                {formatDateTime(data.placedAt)}
              </span>
            </Row>
          </CardContent>
        </Card>
      </div>
    </>
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
