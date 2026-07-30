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
import { Area, AreaChart, CartesianGrid, Line, XAxis, YAxis } from "recharts";
import type { RevenuePoint } from "../data/overview-analytics-data";

const chartConfig: ChartConfig = {
  revenue: { label: "Revenue", color: "var(--primary)" },
  orders: { label: "Orders", color: "var(--status-info)" },
};

export function RevenueOrdersChart({
  data,
  isLoading,
}: {
  data: RevenuePoint[] | undefined;
  isLoading: boolean;
}) {
  return (
    <Card className="border border-border shadow-warm">
      <CardHeader>
        <CardTitle className="text-lg">Revenue & Orders</CardTitle>
        <CardDescription>Daily performance over the range</CardDescription>
      </CardHeader>
      <CardContent className="h-70 pb-6">
        {isLoading || !data ? (
          <Skeleton className="h-full w-full rounded-xl" />
        ) : (
          <ChartContainer config={chartConfig} className="h-full w-full">
            <AreaChart
              data={data}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
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
                name="Revenue"
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
  );
}

export default RevenueOrdersChart;
