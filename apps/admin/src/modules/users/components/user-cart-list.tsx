import {
  Empty,
  EmptyDescription,
  EmptyTitle,
} from "@mumzo/ui/components/empty";
import { Skeleton } from "@mumzo/ui/components/skeleton";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/core/api/query-keys";
import { formatMoney } from "@/core/components/format";
import { getUserCart } from "../api/users-api";

type UserCartListProps = {
  userId: string;
};

export default function UserCartList({ userId }: UserCartListProps) {
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.users.cart(userId),
    queryFn: () => getUserCart(userId),
  });

  if (isLoading) {
    return <Skeleton className="h-48 rounded-2xl" />;
  }

  if (!data || data.items.length === 0) {
    return (
      <Empty>
        <EmptyTitle>Cart is empty</EmptyTitle>
        <EmptyDescription>
          Nothing currently sitting in this customer's cart.
        </EmptyDescription>
      </Empty>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {data.items.map((item) => (
        <div
          key={`${item.productId}-${item.variantLabel ?? ""}`}
          className="flex items-center justify-between gap-4 rounded-xl border px-3 py-2"
        >
          <div className="flex flex-col gap-0.5">
            <span className="text-sm">{item.name}</span>
            {item.variantLabel ? (
              <span className="text-muted-foreground text-xs">
                {item.variantLabel}
              </span>
            ) : null}
          </div>
          <span className="numeric text-muted-foreground text-sm">
            × {item.qty}
          </span>
          <span className="numeric font-medium text-sm">
            {formatMoney(item.price * item.qty)}
          </span>
        </div>
      ))}
    </div>
  );
}
