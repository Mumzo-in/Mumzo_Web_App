import { Button } from "@mumzo/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@mumzo/ui/components/dialog";
import { Separator } from "@mumzo/ui/components/separator";
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
import { useNavigate } from "@tanstack/react-router";
import { queryKeys } from "@/core/api/query-keys";
import { formatDateTime, formatMoney } from "@/core/components/format";
import StatusChip from "@/core/components/status-chip";
import {
  getOrder,
  ORDER_STATUS_META,
  PAYMENT_METHOD_LABELS,
} from "@/modules/orders";

type OrderDetailDialogProps = {
  orderId: string | null;
  onOpenChange: (open: boolean) => void;
};

/** Quick-look summary opened from an ops-board card — a subset of the full
 * `/operations/orders/$orderId` page, with a button through to it for the
 * complete timeline/address/line-item breakdown. */
export function OrderDetailDialog({
  orderId,
  onOpenChange,
}: OrderDetailDialogProps) {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.orders.detail(orderId ?? ""),
    queryFn: () => getOrder(orderId as string),
    enabled: orderId !== null,
  });

  return (
    <Dialog open={orderId !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>
            {data ? `#${data.id.slice(0, 8).toUpperCase()}` : "Order"}
          </DialogTitle>
        </DialogHeader>

        {isLoading || !data ? (
          <div className="flex flex-col gap-3">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ) : (
          <div className="flex flex-col gap-6 sm:flex-row">
            <div className="flex w-full flex-col gap-3 sm:w-64 sm:shrink-0">
              <Row label="Status">
                <StatusChip
                  label={ORDER_STATUS_META[data.status].label}
                  tint={ORDER_STATUS_META[data.status].tint}
                />
              </Row>
              <Row label="Customer">
                <span className="text-sm">{data.customerName}</span>
              </Row>
              <Row label="Hub">
                <span className="text-sm">{data.hubName}</span>
              </Row>
              <Row label="Payment">
                <span className="text-sm">
                  {PAYMENT_METHOD_LABELS[data.paymentMethod] ??
                    data.paymentMethod}
                </span>
              </Row>
              <Row label="Placed">
                <span className="numeric text-sm">
                  {formatDateTime(data.placedAt)}
                </span>
              </Row>

              <div className="flex flex-col gap-1 border-border/60 border-t pt-3">
                <span className="text-muted-foreground text-xs">Address</span>
                <span className="text-sm">
                  {data.addressLine1}
                  {data.addressLine2 ? `, ${data.addressLine2}` : ""}
                </span>
                <span className="text-sm">
                  {data.addressCity} {data.addressPincode}
                </span>
              </div>

              {data.statusLog.length > 0 ? (
                <div className="flex flex-col gap-2 border-border/60 border-t pt-3">
                  <span className="font-semibold text-foreground text-xs">
                    Timeline
                  </span>
                  <ul className="flex flex-col gap-2">
                    {data.statusLog.map((entry) => (
                      <li
                        key={entry.id}
                        className="flex items-center justify-between gap-4"
                      >
                        <span className="text-sm">
                          {ORDER_STATUS_META[entry.toStatus]?.label ??
                            entry.toStatus}
                        </span>
                        <span className="numeric text-muted-foreground text-xs">
                          {formatDateTime(entry.createdAt)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>

            <Separator
              orientation="vertical"
              className="hidden self-stretch sm:block"
            />
            <Separator className="sm:hidden" />

            <div className="flex flex-1 flex-col gap-3">
              <span className="font-semibold text-foreground text-xs">
                Order items
              </span>
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

              <div className="flex justify-end">
                <div className="flex w-full flex-col gap-2 border-border/60 border-t pt-3 sm:w-64">
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
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button
            disabled={!data}
            onClick={() => {
              if (!data) return;
              onOpenChange(false);
              navigate({
                to: "/operations/orders/$orderId",
                params: { orderId: data.id },
              });
            }}
          >
            See more detail
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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

export default OrderDetailDialog;
