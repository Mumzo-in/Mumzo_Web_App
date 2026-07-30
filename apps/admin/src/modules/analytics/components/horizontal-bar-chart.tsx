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
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

type HorizontalBarChartProps<T extends Record<string, unknown>> = {
  title: string;
  description: string;
  data: T[] | undefined;
  isLoading: boolean;
  categoryKey: keyof T & string;
  valueKey: keyof T & string;
  valueLabel: string;
  /** Formats X-axis ticks — e.g. money vs. plain counts. */
  formatValue?: (value: number) => string;
  fill?: string;
};

export function HorizontalBarChart<T extends Record<string, unknown>>({
  title,
  description,
  data,
  isLoading,
  categoryKey,
  valueKey,
  valueLabel,
  formatValue,
  fill = "var(--foreground)",
}: HorizontalBarChartProps<T>) {
  const chartConfig: ChartConfig = {
    [valueKey]: { label: valueLabel, color: fill },
  };

  return (
    <Card className="border border-border shadow-warm">
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="h-70 pb-6">
        {isLoading || !data ? (
          <Skeleton className="h-full w-full rounded-xl" />
        ) : (
          <ChartContainer config={chartConfig} className="h-full w-full">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 0, right: 10, left: 10, bottom: 0 }}
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
                tickFormatter={formatValue}
              />
              <YAxis
                dataKey={categoryKey as string}
                type="category"
                axisLine={false}
                tickLine={false}
                className="font-medium font-sans text-[10px] text-muted-foreground"
                width={100}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar
                dataKey={valueKey as string}
                name={valueLabel}
                fill={fill}
                radius={[0, 4, 4, 0]}
                barSize={16}
              />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}

export default HorizontalBarChart;
