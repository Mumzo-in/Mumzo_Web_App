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
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

const chartConfig: ChartConfig = {
  newUsers: { label: "New users", color: "var(--primary)" },
  totalUsers: { label: "Total users", color: "var(--status-info)" },
};

export function UserGrowthChart({
  data,
  isLoading,
}: {
  data: { date: string; newUsers: number; totalUsers: number }[] | undefined;
  isLoading: boolean;
}) {
  return (
    <Card className="border border-border shadow-warm">
      <CardHeader>
        <CardTitle className="text-lg">User Growth</CardTitle>
        <CardDescription>New signups and cumulative total</CardDescription>
      </CardHeader>
      <CardContent className="h-70 pb-6">
        {isLoading || !data ? (
          <Skeleton className="h-full w-full rounded-xl" />
        ) : (
          <ChartContainer config={chartConfig} className="h-full w-full">
            <LineChart
              data={data}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
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
              <Line
                type="monotone"
                dataKey="newUsers"
                name="New users"
                stroke="var(--primary)"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="totalUsers"
                name="Total users"
                stroke="var(--status-info)"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}

export default UserGrowthChart;
