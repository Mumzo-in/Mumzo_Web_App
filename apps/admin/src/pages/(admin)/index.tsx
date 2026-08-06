import { Badge } from "@mumzo/ui/components/badge";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@mumzo/ui/components/table";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, type LinkProps } from "@tanstack/react-router";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  XAxis,
  YAxis,
} from "recharts";
import { queryKeys } from "@/core/api/query-keys";
import { formatMoney } from "@/core/components/format";
import StatusChip from "@/core/components/status-chip";
import { getDashboard, MetricCard } from "@/modules/dashboard";
import { ORDER_STATUS_META } from "@/modules/orders";

export const Route = createFileRoute("/(admin)/")({
  component: DashboardPage,
});

const METRIC_SKELETONS = ["m1", "m2", "m3", "m4"] as const;

const salesChartConfig: ChartConfig = {
  revenue: {
    label: "GMV",
    color: "var(--primary)",
  },
  orders: {
    label: "Orders",
    color: "var(--status-info)",
  },
};

const categoryChartConfig: ChartConfig = {
  value: {
    label: "Sales Value",
    color: "var(--foreground)",
  },
};

function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.dashboard.overview(),
    queryFn: getDashboard,
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Needs Attention Bar */}
      <Card
        className="border border-border shadow-warm"
        data-testid="admin-needs-attention"
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 px-6 py-4">
          <div className="flex flex-col gap-1">
            <CardTitle className="text-lg">Needs attention</CardTitle>
            <CardDescription className="text-xs">
              Queues that are waiting on someone.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3 px-6 pb-4">
          <AttentionLink
            to="/catalog/products"
            label="Low stock"
            count={data?.lowStockCount}
            loading={isLoading}
          />
          <AttentionLink
            to="/finance/refunds"
            search={{ status: "pending" }}
            label="Pending refunds"
            count={data?.pendingRefunds}
            loading={isLoading}
          />
        </CardContent>
      </Card>

      {/* Metric Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading || !data
          ? METRIC_SKELETONS.map((key) => (
              <Skeleton key={key} className="h-32 rounded-2xl" />
            ))
          : data.metrics.map((metric) => (
              <MetricCard key={metric.id} metric={metric} />
            ))}
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Sales Trend Chart */}
        <Card className="border border-border shadow-warm">
          <CardHeader>
            <CardTitle className="text-lg">Revenue & Orders Trend</CardTitle>
            <CardDescription>
              Daily performance over the last 7 days
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] pb-6">
            {isLoading || !data ? (
              <Skeleton className="h-full w-full rounded-xl" />
            ) : (
              <ChartContainer
                config={salesChartConfig}
                className="h-full w-full"
              >
                <AreaChart
                  data={data.salesData}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id="colorRevenue"
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
                    tickFormatter={(val) => `₹${val / 1000}k`}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    name="GMV"
                    stroke="var(--primary)"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                  />
                  <Line
                    type="monotone"
                    dataKey="orders"
                    name="Orders"
                    stroke="var(--status-info)"
                    strokeWidth={2}
                    dot={false}
                  />
                </AreaChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* Category breakdown Chart */}
        <Card className="border border-border shadow-warm">
          <CardHeader>
            <CardTitle className="text-lg">Sales by Category</CardTitle>
            <CardDescription>Top category contribution in GMV</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] pb-6">
            {isLoading || !data ? (
              <Skeleton className="h-full w-full rounded-xl" />
            ) : (
              <ChartContainer
                config={categoryChartConfig}
                className="h-full w-full"
              >
                <BarChart
                  data={data.categoryData}
                  layout="vertical"
                  margin={{ top: 0, right: 10, left: 40, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    horizontal={false}
                    className="stroke-border/50"
                  />
                  <XAxis
                    type="number"
                    axisLine={false}
                    tickLine={false}
                    className="font-medium text-[10px] text-muted-foreground"
                    tickFormatter={(val) => `₹${val / 1000}k`}
                  />
                  <YAxis
                    dataKey="name"
                    type="category"
                    axisLine={false}
                    tickLine={false}
                    className="font-medium font-sans text-[10px] text-muted-foreground"
                    width={100}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar
                    dataKey="value"
                    name="Sales"
                    fill="var(--accent-foreground)"
                    radius={[0, 4, 4, 0]}
                    barSize={16}
                  />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tables/Detail Lists */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Orders Table */}
        <Card className="border border-border shadow-warm lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div className="flex flex-col gap-1">
              <CardTitle className="text-lg">Recent Orders</CardTitle>
              <CardDescription>Realtime dispatch status</CardDescription>
            </div>
            <Link
              to="/operations/orders"
              className="font-medium text-primary text-xs hover:underline"
            >
              View all orders
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading || !data ? (
              <div className="flex flex-col gap-4 p-6">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px] pl-6">Order</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead className="hidden md:table-cell">
                      Items
                    </TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="pr-6 text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.recentOrders.map((order) => {
                    const meta = ORDER_STATUS_META[
                      order.status as keyof typeof ORDER_STATUS_META
                    ] ?? { label: order.status, tint: "bg-secondary" };
                    return (
                      <TableRow key={order.id}>
                        <TableCell className="pl-6 font-medium font-mono text-xs">
                          #{order.id.slice(0, 8).toUpperCase()}
                        </TableCell>
                        <TableCell>
                          <span className="font-semibold text-foreground text-xs">
                            {order.customerName}
                          </span>
                        </TableCell>
                        <TableCell className="hidden text-muted-foreground text-xs md:table-cell">
                          {order.itemCount} item
                          {order.itemCount === 1 ? "" : "s"}
                        </TableCell>
                        <TableCell className="numeric text-right font-medium text-xs">
                          {formatMoney(order.total)}
                        </TableCell>
                        <TableCell className="pr-6 text-center">
                          <div className="flex items-center justify-center">
                            <StatusChip label={meta.label} tint={meta.tint} />
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Recently Joined Moms list */}
        <Card className="border border-border shadow-warm">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div className="flex flex-col gap-1">
              <CardTitle className="text-lg">New Momzos</CardTitle>
              <CardDescription>Recently registered moms</CardDescription>
            </div>
            <Link
              to="/customers"
              className="font-medium text-primary text-xs hover:underline"
            >
              View all
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading || !data ? (
              <div className="flex flex-col gap-4 p-6">
                <Skeleton className="h-12 w-full rounded-lg" />
                <Skeleton className="h-12 w-full rounded-lg" />
                <Skeleton className="h-12 w-full rounded-lg" />
              </div>
            ) : (
              <div className="divide-y divide-border">
                {data.recentMoms.map((mom) => (
                  <div
                    key={mom.id}
                    className="flex items-center justify-between p-4 transition-colors hover:bg-muted/30"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex size-8 items-center justify-center rounded-full bg-accent font-editorial font-semibold text-accent-foreground text-xs">
                        {mom.name.charAt(0)}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-semibold text-foreground text-xs">
                          {mom.name}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {mom.phoneNumber ?? "No phone on file"}
                        </span>
                        {mom.babyName && (
                          <span className="text-[10px] text-muted-foreground">
                            Baby: {mom.babyName}
                            {mom.babyAge ? ` (${mom.babyAge})` : ""}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge
                        variant="outline"
                        className="h-4 rounded-full border-primary/20 px-1.5 py-0 text-[9px] text-primary"
                      >
                        {mom.orderCount}{" "}
                        {mom.orderCount === 1 ? "order" : "orders"}
                      </Badge>
                      <span className="text-[9px] text-muted-foreground">
                        {mom.joinedAt}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

type AttentionLinkProps = {
  /** Any real route — derived from the router so it can't drift on a move. */
  to: LinkProps["to"];
  search?: LinkProps["search"];
  label: string;
  count?: number;
  loading: boolean;
};

function AttentionLink({
  to,
  search,
  label,
  count,
  loading,
}: AttentionLinkProps) {
  if (loading) {
    return <Skeleton className="h-9 w-36 rounded-full" />;
  }

  return (
    <Link
      to={to}
      search={search}
      className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors hover:bg-accent"
      data-testid={`admin-attention-${label}`}
    >
      {label}
      <Badge variant={count && count > 0 ? "default" : "secondary"}>
        {count ?? 0}
      </Badge>
    </Link>
  );
}
