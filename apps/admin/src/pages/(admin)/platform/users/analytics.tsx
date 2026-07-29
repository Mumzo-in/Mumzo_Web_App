import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@mumzo/ui/components/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@mumzo/ui/components/chart";
import { Skeleton } from "@mumzo/ui/components/skeleton";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts";
import { z } from "zod";
import { queryKeys } from "@/core/api/query-keys";
import { usePaginatedList } from "@/core/api/use-paginated-list";
import DataTable from "@/core/components/data-table";
import { DateRangePicker } from "@/core/components/date-range/date-range-picker";
import { resolveDateRangePreset } from "@/core/components/date-range/date-range-presets";
import { formatDate } from "@/core/components/format";
import PageHeader from "@/core/components/page-header";
import { MetricCard } from "@/modules/dashboard";
import {
  type AdminUser,
  DEFAULT_USER_SORT,
  getUserAnalytics,
  listUsers,
} from "@/modules/users";

const DEFAULT_RANGE = resolveDateRangePreset("last30Days");

const searchSchema = z.object({
  from: z.string().catch(DEFAULT_RANGE.from),
  to: z.string().catch(DEFAULT_RANGE.to),
});

export const Route = createFileRoute("/(admin)/platform/users/analytics")({
  component: UserAnalyticsPage,
  validateSearch: searchSchema,
});

const METRIC_SKELETONS = ["m1", "m2", "m3", "m4", "m5", "m6"] as const;

const growthChartConfig: ChartConfig = {
  newUsers: {
    label: "New users",
    color: "var(--primary)",
  },
  totalUsers: {
    label: "Total users",
    color: "var(--status-info)",
  },
};

const retentionChartConfig: ChartConfig = {
  retentionPct: {
    label: "Retention",
    color: "var(--primary)",
  },
};

const RECENT_USERS_LIMIT = 10;

const recentUserColumns: ColumnDef<AdminUser, unknown>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => (
      <span className="font-medium text-foreground text-xs">
        {row.original.name}
      </span>
    ),
  },
  {
    accessorKey: "phone",
    header: "Phone",
    enableSorting: false,
    cell: ({ row }) => (
      <span className="numeric text-foreground text-xs">
        {row.original.phone ?? "—"}
      </span>
    ),
  },
  {
    id: "babies",
    header: "Babies",
    enableSorting: false,
    cell: ({ row }) => (
      <span className="text-foreground text-xs">
        {row.original.babies.length > 0
          ? row.original.babies.map((baby) => baby.name).join(", ")
          : "—"}
      </span>
    ),
  },
  {
    accessorKey: "joinedAt",
    header: "Joined",
    cell: ({ row }) => (
      <span className="numeric text-foreground text-xs">
        {formatDate(row.original.joinedAt)}
      </span>
    ),
  },
];

function UserAnalyticsPage() {
  const range = Route.useSearch();
  const navigate = Route.useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.users.analytics(range),
    queryFn: () => getUserAnalytics(range),
  });

  const recentUsers = usePaginatedList({
    queryKey: queryKeys.users.lists(),
    fetcher: listUsers,
    columns: recentUserColumns,
    initialLimit: RECENT_USERS_LIMIT,
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Analytics"
        description="Growth, activity, and value across the customer base."
        actions={
          <div className="flex items-center gap-3">
            <DateRangePicker
              value={range}
              onChange={(next) => navigate({ search: next })}
              testId="analytics-date-range"
            />
            <Link
              to="/platform/users/list"
              search={{ q: "", sort: DEFAULT_USER_SORT, page: 1 }}
              className="font-medium text-primary text-sm hover:underline"
            >
              View all users
            </Link>
          </div>
        }
      />

      {/* Metric Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading || !data
          ? METRIC_SKELETONS.map((key) => (
              <Skeleton key={key} className="h-32 rounded-2xl" />
            ))
          : data.metrics.map((metric) => (
              <MetricCard key={metric.id} metric={metric} />
            ))}
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Growth Chart */}
        <Card className="border border-border shadow-warm">
          <CardHeader>
            <CardTitle className="text-lg">User Growth</CardTitle>
            <CardDescription>
              New signups and cumulative total, monthly
            </CardDescription>
          </CardHeader>
          <CardContent className="h-70 pb-6">
            {isLoading || !data ? (
              <Skeleton className="h-full w-full rounded-xl" />
            ) : (
              <ChartContainer
                config={growthChartConfig}
                className="h-full w-full"
              >
                <AreaChart
                  data={data.growth}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id="colorNewUsers"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor="var(--primary)"
                        stopOpacity={0.15}
                      />
                      <stop
                        offset="95%"
                        stopColor="var(--primary)"
                        stopOpacity={0.0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    className="stroke-border/50"
                  />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    className="font-medium text-[10px] text-muted-foreground"
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    className="font-medium text-[10px] text-muted-foreground"
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area
                    type="monotone"
                    dataKey="newUsers"
                    name="New users"
                    stroke="var(--primary)"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorNewUsers)"
                  />
                  <Line
                    type="monotone"
                    dataKey="totalUsers"
                    name="Total users"
                    stroke="var(--status-info)"
                    strokeWidth={2}
                    dot={false}
                  />
                </AreaChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* Retention Curve */}
        <Card className="border border-border shadow-warm">
          <CardHeader>
            <CardTitle className="text-lg">Order Retention</CardTitle>
            <CardDescription>
              % of a signup cohort still ordering, by month since signup
            </CardDescription>
          </CardHeader>
          <CardContent className="h-70 pb-6">
            {isLoading || !data ? (
              <Skeleton className="h-full w-full rounded-xl" />
            ) : (
              <ChartContainer
                config={retentionChartConfig}
                className="h-full w-full"
              >
                <LineChart
                  data={data.retention}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    className="stroke-border/50"
                  />
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(val) => `M${val}`}
                    className="font-medium text-[10px] text-muted-foreground"
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(val) => `${val}%`}
                    className="font-medium text-[10px] text-muted-foreground"
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line
                    type="monotone"
                    dataKey="retentionPct"
                    name="Retention"
                    stroke="var(--primary)"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Users */}
      <Card className="border border-border shadow-warm">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div className="flex flex-col gap-1">
            <CardTitle className="text-lg">Recent Users</CardTitle>
            <CardDescription>Most recently registered accounts</CardDescription>
          </div>
          <Link
            to="/platform/users/list"
            search={{ q: "", sort: DEFAULT_USER_SORT, page: 1 }}
            className="font-medium text-primary text-xs hover:underline"
          >
            View all users
          </Link>
        </CardHeader>
        <CardContent className="p-4">
          <DataTable
            table={recentUsers.table}
            meta={recentUsers.meta}
            isLoading={recentUsers.isLoading}
            isFetching={recentUsers.isFetching}
            error={recentUsers.error}
            hasNext={recentUsers.hasNext}
            hasPrev={recentUsers.hasPrev}
            page={recentUsers.page}
            onPageChange={recentUsers.setPage}
            testId="admin-recent-users-table"
            emptyTitle="No customers yet"
            emptyDescription="New signups will show up here."
          />
        </CardContent>
      </Card>
    </div>
  );
}
