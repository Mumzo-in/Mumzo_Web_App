import {
  Empty,
  EmptyDescription,
  EmptyTitle,
} from "@mumzo/ui/components/empty";
import { Skeleton } from "@mumzo/ui/components/skeleton";
import { useQuery } from "@tanstack/react-query";
import { Clock } from "lucide-react";
import { queryKeys } from "@/core/api/query-keys";
import { formatDateTime } from "@/core/components/format";
import { listUserActivity } from "../api/users-api";
import { CUSTOMER_EVENT_LABELS } from "../data/user-data";

type CustomerActivityTimelineProps = {
  userId: string;
};

export default function CustomerActivityTimeline({
  userId,
}: CustomerActivityTimelineProps) {
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.users.activity(userId),
    queryFn: () => listUserActivity(userId, { limit: 30 }),
  });

  if (isLoading) {
    return <Skeleton className="h-48 rounded-2xl" />;
  }

  if (!data || data.data.length === 0) {
    return (
      <Empty>
        <EmptyTitle>No activity recorded</EmptyTitle>
        <EmptyDescription>
          Cart, wishlist, and order actions will show up here.
        </EmptyDescription>
      </Empty>
    );
  }

  return (
    <div className="relative ml-4 flex flex-col gap-4 border-border/80 border-l-2 pl-6">
      {data.data.map((event) => (
        <div key={event.id} className="group relative">
          <span className="absolute top-1.5 -left-[31px] flex h-4 w-4 items-center justify-center rounded-full border-2 border-primary bg-background">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          </span>
          <div className="flex flex-col gap-1 rounded-xl border px-3 py-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium text-sm">
                {CUSTOMER_EVENT_LABELS[event.action] ?? event.action}
              </span>
              <span className="flex items-center gap-1 text-muted-foreground text-xs">
                <Clock className="size-3.5" />
                {formatDateTime(event.createdAt)}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
