import { Badge } from "@mumzo/ui/components/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@mumzo/ui/components/card";
import { Separator } from "@mumzo/ui/components/separator";
import { formatMoney } from "@/core/components/format";
import { PAYMENT_METHOD_LABELS } from "@/modules/orders";
import type { DeliveryRun } from "../data/delivery-data";

type DeliveryOrderCardProps = {
  run: DeliveryRun;
};

/** What's in the bag and what to collect. The cash callout is the load-bearing
 * bit for COD runs, so it gets its own emphasised row. */
export function DeliveryOrderCard({ run }: DeliveryOrderCardProps) {
  return (
    <Card data-testid="delivery-order-card">
      <CardHeader>
        <CardTitle className="text-base">
          Order #{run.orderId.slice(0, 8).toUpperCase()}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <ul className="flex flex-col gap-3">
          {run.items.map((item) => (
            <li
              key={item.id}
              className="flex items-start justify-between gap-3"
            >
              <div className="flex flex-col gap-0.5">
                <span className="text-foreground text-sm">{item.name}</span>
                {item.variantLabel ? (
                  <span className="text-muted-foreground text-xs">
                    {item.variantLabel}
                  </span>
                ) : null}
              </div>
              <span className="numeric shrink-0 text-muted-foreground text-sm">
                × {item.qty}
              </span>
            </li>
          ))}
        </ul>

        <Separator />

        <div className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground text-sm">Payment</span>
          <Badge variant="secondary">
            {PAYMENT_METHOD_LABELS[run.paymentMethod] ?? run.paymentMethod}
          </Badge>
        </div>

        <div className="flex items-center justify-between gap-2 rounded-2xl bg-secondary px-4 py-3">
          <span className="font-medium text-foreground text-sm">
            {run.collectCash ? "Collect from customer" : "Order total (paid)"}
          </span>
          <span className="numeric font-semibold text-foreground text-lg">
            {formatMoney(run.total)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

export default DeliveryOrderCard;
