import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@mumzo/ui/components/card";
import {
  Empty,
  EmptyDescription,
  EmptyTitle,
} from "@mumzo/ui/components/empty";
import { Skeleton } from "@mumzo/ui/components/skeleton";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@mumzo/ui/components/tabs";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { queryKeys } from "@/core/api/query-keys";
import { DateRangePicker } from "@/core/components/date-range/date-range-picker";
import { resolveDateRangePreset } from "@/core/components/date-range/date-range-presets";
import {
  getOverviewAnalytics,
  HorizontalBarChart,
  RecentUsersTable,
  RevenueOrdersChart,
  UserGrowthChart,
} from "@/modules/analytics";
import { MetricCard } from "@/modules/dashboard";
import { OrderTable } from "@/modules/orders";

const DEFAULT_RANGE = resolveDateRangePreset("last30Days");
const TABS = ["overview", "orders", "users"] as const;

const searchSchema = z.object({
  from: z.string().catch(DEFAULT_RANGE.from),
  to: z.string().catch(DEFAULT_RANGE.to),
  tab: z.enum(TABS).catch("overview"),
});

export const Route = createFileRoute("/(admin)/overview/analytics")({
  component: AnalyticsPage,
  validateSearch: searchSchema,
});

const METRIC_SKELETONS = ["m1", "m2", "m3", "m4"] as const;
const ORDER_METRIC_IDS = new Set(["revenue", "orders", "aov"]);

function AnalyticsPage() {
  const { from, to, tab } = Route.useSearch();
  const navigate = Route.useNavigate();
  const range = { from, to };

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.overviewAnalytics.range(range),
    queryFn: () => getOverviewAnalytics(range),
  });

  const orderMetrics = data?.metrics.filter((metric) =>
    ORDER_METRIC_IDS.has(metric.id),
  );
  const userMetrics = data?.metrics.filter(
    (metric) => metric.id === "total-users",
  );

  return (
    <Tabs
      value={tab}
      onValueChange={(value) =>
        navigate({
          search: (prev) => ({ ...prev, tab: value as (typeof TABS)[number] }),
        })
      }
      className="flex flex-col gap-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <TabsList className="border border-border bg-secondary">
          <TabsTrigger value="overview" data-testid="analytics-tab-overview">
            Overview
          </TabsTrigger>
          <TabsTrigger value="orders" data-testid="analytics-tab-orders">
            Orders
          </TabsTrigger>
          <TabsTrigger value="users" data-testid="analytics-tab-users">
            Users
          </TabsTrigger>
        </TabsList>

        <DateRangePicker
          value={range}
          onChange={(next) =>
            navigate({ search: (prev) => ({ ...prev, ...next }) })
          }
          testId="overview-analytics-date-range"
        />
      </div>

      <TabsContent value="overview" className="flex flex-col gap-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {isLoading || !data
            ? METRIC_SKELETONS.map((key) => (
                <Skeleton key={key} className="h-32 rounded-2xl" />
              ))
            : data.metrics.map((metric) => (
                <MetricCard key={metric.id} metric={metric} />
              ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <RevenueOrdersChart data={data?.revenue} isLoading={isLoading} />
          <UserGrowthChart data={data?.userGrowth} isLoading={isLoading} />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <HorizontalBarChart
            title="Orders by Status"
            description="Distribution across the range"
            data={data?.orderStatus}
            isLoading={isLoading}
            categoryKey="label"
            valueKey="count"
            valueLabel="Orders"
          />
          <HorizontalBarChart
            title="Revenue by Category"
            description="All-time contribution (not range-filtered)"
            data={data?.categoryRevenue}
            isLoading={isLoading}
            categoryKey="name"
            valueKey="value"
            valueLabel="Revenue"
            fill="var(--accent-foreground)"
            formatValue={(val) => `₹${val / 1000}k`}
          />
        </div>
      </TabsContent>

      <TabsContent value="orders" className="flex flex-col gap-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading || !orderMetrics
            ? METRIC_SKELETONS.slice(0, 3).map((key) => (
                <Skeleton key={key} className="h-32 rounded-2xl" />
              ))
            : orderMetrics.map((metric) => (
                <MetricCard key={metric.id} metric={metric} />
              ))}
        </div>

        <RevenueOrdersChart data={data?.revenue} isLoading={isLoading} />

        <div className="grid gap-6 lg:grid-cols-2">
          <HorizontalBarChart
            title="Orders by Status"
            description="Distribution across the range"
            data={data?.orderStatus}
            isLoading={isLoading}
            categoryKey="label"
            valueKey="count"
            valueLabel="Orders"
          />
          <HorizontalBarChart
            title="Revenue by Hub"
            description="Contribution per dark store"
            data={data?.hubRevenue}
            isLoading={isLoading}
            categoryKey="hub"
            valueKey="revenue"
            valueLabel="Revenue"
            fill="var(--status-info)"
            formatValue={(val) => `₹${val / 1000}k`}
          />
        </div>

        <HorizontalBarChart
          title="Payment Mode"
          description="Orders by how the customer paid"
          data={data?.paymentMode}
          isLoading={isLoading}
          categoryKey="label"
          valueKey="count"
          valueLabel="Orders"
          fill="var(--accent-foreground)"
        />

        <Card className="border border-border shadow-warm">
          <CardHeader>
            <CardTitle className="text-lg">All Orders</CardTitle>
            <CardDescription>Search, filter, and drill in</CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <OrderTable />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="users" className="flex flex-col gap-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {isLoading || !userMetrics
            ? METRIC_SKELETONS.slice(0, 1).map((key) => (
                <Skeleton key={key} className="h-32 rounded-2xl" />
              ))
            : userMetrics.map((metric) => (
                <MetricCard key={metric.id} metric={metric} />
              ))}
        </div>

        <UserGrowthChart data={data?.userGrowth} isLoading={isLoading} />

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="shadow-warm">
            <CardHeader>
              <CardTitle className="text-lg">New vs Returning</CardTitle>
              <CardDescription>
                Needs a purchase-history join to compute for real
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Empty>
                <EmptyTitle>Not available yet</EmptyTitle>
                <EmptyDescription>
                  This needs to be built — repeat-purchase segmentation isn't
                  wired up on the backend yet.
                </EmptyDescription>
              </Empty>
            </CardContent>
          </Card>
          <HorizontalBarChart
            title="Baby Age Distribution"
            description="Sampled from registered baby profiles"
            data={data?.babyAgeBuckets}
            isLoading={isLoading}
            categoryKey="bucket"
            valueKey="count"
            valueLabel="Babies"
            fill="var(--accent-foreground)"
          />
        </div>

        <RecentUsersTable data={data?.recentUsers} isLoading={isLoading} />
      </TabsContent>
    </Tabs>
  );
}
