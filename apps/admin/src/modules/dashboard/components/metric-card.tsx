import { Card, CardContent } from "@mumzo/ui/components/card";
import { cn } from "@mumzo/ui/lib/utils";
import { Minus, TrendingDown, TrendingUp } from "lucide-react";
import type { DashboardMetric } from "../data/dashboard-data";

const TREND_ICON = {
  up: TrendingUp,
  down: TrendingDown,
  flat: Minus,
} as const;

/**
 * A falling AOV isn't inherently bad and a rising one isn't inherently good,
 * so trend colour is deliberately neutral — direction is shown, judgement is
 * left to the operator.
 */
const TREND_TINT = {
  up: "text-status-success",
  down: "text-status-danger",
  flat: "text-muted-foreground",
} as const;

export function MetricCard({ metric }: { metric: DashboardMetric }) {
  const Icon = metric.trend ? TREND_ICON[metric.trend] : null;

  return (
    <Card className="shadow-warm" data-testid={`admin-metric-${metric.id}`}>
      <CardContent className="flex flex-col gap-2 p-5">
        <span className="text-muted-foreground text-sm">{metric.label}</span>
        <span className="numeric font-editorial text-3xl tracking-tighter">
          {metric.value}
        </span>
        <span className="flex items-center gap-1.5 text-xs">
          {Icon && metric.trend ? (
            <>
              <Icon className={cn("size-3.5", TREND_TINT[metric.trend])} />
              <span
                className={cn("numeric font-medium", TREND_TINT[metric.trend])}
              >
                {(metric.changePct ?? 0) > 0 ? "+" : ""}
                {metric.changePct}%
              </span>
            </>
          ) : null}
          <span className="text-muted-foreground">{metric.hint}</span>
        </span>
      </CardContent>
    </Card>
  );
}

export default MetricCard;
