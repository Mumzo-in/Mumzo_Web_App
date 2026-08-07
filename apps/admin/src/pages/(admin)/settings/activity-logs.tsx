import { Button } from "@mumzo/ui/components/button";
import { Input } from "@mumzo/ui/components/input";
import { Skeleton } from "@mumzo/ui/components/skeleton";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  Search,
} from "lucide-react";
import { useState } from "react";

import { apiList } from "@/core/api/client";
import { queryKeys } from "@/core/api/query-keys";
import PageHeader from "@/core/components/page-header";
import {
  type ActivityLog,
  ActivityLogsTimeline,
} from "@/modules/activity-logs/components/activity-logs-timeline";

export const Route = createFileRoute("/(admin)/settings/activity-logs")({
  component: ActivityLogsRouteComponent,
});

function ActivityLogsRouteComponent() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [entityType, setEntityType] = useState("");
  const [staffUserId, setStaffUserId] = useState("");

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: [
      ...queryKeys.activityLogs.lists(),
      { page, limit: 20, search, entityType, staffUserId },
    ],
    queryFn: () =>
      apiList<ActivityLog>("/activity-logs", {
        page,
        limit: 20,
        search: search || undefined,
        entityType: entityType || undefined,
        staffUserId: staffUserId || undefined,
      }),
  });

  const handleResetFilters = () => {
    setSearch("");
    setEntityType("");
    setStaffUserId("");
    setPage(1);
  };

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <PageHeader
        title="Activity Logs"
        description="Audit trail of administrative actions performed by staff."
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="flex items-center gap-1.5"
          >
            <RotateCcw className="h-4 w-4" />
            Refresh
          </Button>
        }
      />

      {/* Filters Toolbar */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border/80 bg-card p-4 shadow-warm">
        {/* Search */}
        <div className="relative min-w-[240px] flex-1">
          <Search className="absolute top-2.5 left-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search logs description or action..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9"
          />
        </div>

        {/* Entity Type Filter */}
        <div className="w-[180px]">
          <Input
            placeholder="Entity Type (e.g. product)"
            value={entityType}
            onChange={(e) => {
              setEntityType(e.target.value);
              setPage(1);
            }}
          />
        </div>

        {/* Staff User ID Filter */}
        <div className="w-[180px]">
          <Input
            placeholder="Staff User ID"
            value={staffUserId}
            onChange={(e) => {
              setStaffUserId(e.target.value);
              setPage(1);
            }}
          />
        </div>

        {(search || entityType || staffUserId) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleResetFilters}
            className="text-muted-foreground text-xs hover:text-foreground"
          >
            Clear Filters
          </Button>
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-20 w-full rounded-xl" />
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-destructive/50 border-dashed bg-destructive/5 p-12 text-center text-destructive">
          <Activity className="mb-3 h-12 w-12" />
          <h3 className="font-semibold text-lg">Error loading activity logs</h3>
          <p className="mt-1 max-w-sm text-sm">
            {error instanceof Error
              ? error.message
              : "An unexpected error occurred"}
          </p>
        </div>
      ) : (
        <>
          <ActivityLogsTimeline logs={data?.data ?? []} />

          {/* Pagination */}
          {data && data.meta.total > 0 && (
            <div className="mt-2 flex items-center justify-between border-border/80 border-t pt-4">
              <span className="text-muted-foreground text-xs">
                Showing {Math.min((page - 1) * 20 + 1, data.meta.total)} to{" "}
                {Math.min(page * 20, data.meta.total)} of {data.meta.total} logs
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                  className="flex items-center gap-1"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Prev
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!data.meta.hasNext}
                  onClick={() => setPage((prev) => prev + 1)}
                  className="flex items-center gap-1"
                >
                  Next
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
export default ActivityLogsRouteComponent;
