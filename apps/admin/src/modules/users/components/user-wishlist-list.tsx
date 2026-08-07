import {
  Empty,
  EmptyDescription,
  EmptyTitle,
} from "@mumzo/ui/components/empty";
import { Skeleton } from "@mumzo/ui/components/skeleton";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/core/api/query-keys";
import { formatDate, formatMoney } from "@/core/components/format";
import { listUserWishlist } from "../api/users-api";

type UserWishlistListProps = {
  userId: string;
};

export default function UserWishlistList({ userId }: UserWishlistListProps) {
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.users.wishlist(userId),
    queryFn: () => listUserWishlist(userId, { limit: 20 }),
  });

  if (isLoading) {
    return <Skeleton className="h-48 rounded-2xl" />;
  }

  if (!data || data.data.length === 0) {
    return (
      <Empty>
        <EmptyTitle>Wishlist is empty</EmptyTitle>
        <EmptyDescription>
          This customer hasn't wishlisted any products.
        </EmptyDescription>
      </Empty>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {data.data.map((item) => (
        <div
          key={item.productId}
          className="flex items-center justify-between gap-4 rounded-xl border px-3 py-2"
        >
          <span className="text-sm">{item.name}</span>
          <span className="numeric font-medium text-sm">
            {formatMoney(item.price)}
          </span>
          <span className="numeric text-muted-foreground text-xs">
            {formatDate(item.addedAt)}
          </span>
        </div>
      ))}
    </div>
  );
}
