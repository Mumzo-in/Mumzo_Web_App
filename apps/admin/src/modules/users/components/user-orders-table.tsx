import {
  Empty,
  EmptyDescription,
  EmptyTitle,
} from "@mumzo/ui/components/empty";
import { Skeleton } from "@mumzo/ui/components/skeleton";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/core/api/query-keys";
import { formatDateTime, formatMoney } from "@/core/components/format";
import StatusChip from "@/core/components/status-chip";
import { ORDER_STATUS_META, PAYMENT_METHOD_LABELS } from "@/modules/orders";
import { listUserOrders } from "../api/users-api";

type UserOrdersTableProps = {
  userId: string;
};

export default function UserOrdersTable({ userId }: UserOrdersTableProps) {
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.users.orders(userId),
    queryFn: () => listUserOrders(userId, { limit: 20 }),
  });

  if (isLoading) {
    return <Skeleton className="h-48 rounded-2xl" />;
  }

  if (!data || data.data.length === 0) {
    return (
      <Empty>
        <EmptyTitle>No orders yet</EmptyTitle>
        <EmptyDescription>
          This customer hasn't placed an order.
        </EmptyDescription>
      </Empty>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {data.data.map((order) => {
        const meta = ORDER_STATUS_META[order.status];
        return (
          <div
            key={order.id}
            className="flex items-center justify-between gap-4 rounded-xl border px-3 py-2"
          >
            <div className="flex flex-col gap-0.5">
              <span className="numeric font-medium text-sm">
                #{order.id.slice(0, 8).toUpperCase()}
              </span>
              <span className="text-muted-foreground text-xs">
                {order.itemCount} item{order.itemCount === 1 ? "" : "s"} ·{" "}
                {PAYMENT_METHOD_LABELS[order.paymentMethod] ??
                  order.paymentMethod}
              </span>
            </div>
            <StatusChip label={meta.label} tint={meta.tint} />
            <span className="numeric font-medium text-sm">
              {formatMoney(order.total)}
            </span>
            <span className="numeric text-muted-foreground text-xs">
              {formatDateTime(order.placedAt)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
