import { Button } from "@mumzo/ui/components/button";
import {
  Empty,
  EmptyDescription,
  EmptyTitle,
} from "@mumzo/ui/components/empty";
import { Input } from "@mumzo/ui/components/input";
import { Skeleton } from "@mumzo/ui/components/skeleton";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Clock, RotateCcw, Search } from "lucide-react";
import { useState } from "react";
import { queryKeys } from "@/core/api/query-keys";
import { formatDateTime } from "@/core/components/format";
import PageHeader from "@/core/components/page-header";
import { CUSTOMER_EVENT_LABELS, listCustomerEvents } from "@/modules/users";

export const Route = createFileRoute("/(admin)/platform/users/activity")({
  component: UserActivityPage,
});

const PAGE_SIZE = 20;

function UserActivityPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: [
      ...queryKeys.customerEvents.lists(),
      { page, limit: PAGE_SIZE, search },
    ],
    queryFn: () =>
      listCustomerEvents({
        page,
        limit: PAGE_SIZE,
        search: search || undefined,
      }),
  });

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <PageHeader
        title="User Activity"
        description="Cart, wishlist, and order actions across every customer."
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="flex items-center gap-1.5"
          >
            <RotateCcw className="size-4" />
            Refresh
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border/80 bg-card p-4 shadow-warm">
        <div className="relative min-w-[240px] flex-1">
          <Search className="absolute top-2.5 left-3 size-4 text-muted-foreground" />
          <Input
            placeholder="Search by customer name, email, or action…"
            value={search}
            data-testid="admin-user-activity-search"
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            className="pl-9"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-4">
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-20 w-full rounded-xl" />
        </div>
      ) : !data || data.data.length === 0 ? (
        <Empty>
          <EmptyTitle>No activity recorded</EmptyTitle>
          <EmptyDescription>
            Customer cart, wishlist, and order actions will show up here.
          </EmptyDescription>
        </Empty>
      ) : (
        <>
          <div
            className="relative ml-4 flex flex-col gap-4 border-border/80 border-l-2 pl-6"
            data-testid="admin-user-activity-timeline"
          >
            {data.data.map((event) => (
              <div key={event.id} className="group relative">
                <span className="absolute top-1.5 -left-[31px] flex h-4 w-4 items-center justify-center rounded-full border-2 border-primary bg-background">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                </span>
                <div className="flex flex-col gap-1 rounded-xl border px-3 py-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium text-sm">
                      {CUSTOMER_EVENT_LABELS[event.action] ?? event.action}
                    </span>
                    <span className="flex items-center gap-1 text-muted-foreground text-xs">
                      <Clock className="size-3.5" />
                      {formatDateTime(event.createdAt)}
                    </span>
                  </div>
                  <Link
                    to="/platform/users/$userId"
                    params={{ userId: event.userId }}
                    className="text-primary text-xs hover:underline"
                  >
                    {event.userName ?? event.userEmail ?? event.userId}
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {data.meta.total > 0 && (
            <div className="mt-2 flex items-center justify-between border-border/80 border-t pt-4">
              <span className="text-muted-foreground text-xs">
                Showing {Math.min((page - 1) * PAGE_SIZE + 1, data.meta.total)}{" "}
                to {Math.min(page * PAGE_SIZE, data.meta.total)} of{" "}
                {data.meta.total} events
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1 || isFetching}
                  onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                  className="flex items-center gap-1"
                >
                  <ArrowLeft className="size-4" />
                  Prev
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!data.meta.hasNext || isFetching}
                  onClick={() => setPage((prev) => prev + 1)}
                  className="flex items-center gap-1"
                >
                  Next
                  <ArrowRight className="size-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
