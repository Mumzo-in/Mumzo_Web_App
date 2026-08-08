import type { DashboardMetric } from "@/modules/dashboard";

export type GrowthPoint = {
  date: string;
  newUsers: number;
  totalUsers: number;
};

export type RetentionPoint = {
  /** Months since signup. */
  month: number;
  /** % of the cohort still ordering at this point. */
  retentionPct: number;
};

export type UserAnalyticsSummary = {
  metrics: DashboardMetric[];
  growth: GrowthPoint[];
  retention: RetentionPoint[];
};

/** Raw shape from `GET /users/analytics/metrics` — mapped into
 * `DashboardMetric[]` (pre-formatted, display-ready) in `user-analytics-api.ts`. */
export type UserAnalyticsMetrics = {
  activeOrderedCount: number;
  activeOrderedChangePct: number;
  activeSessionCount: number;
  activeSessionChangePct: number;
  repeatPurchaseRatePct: number;
  repeatPurchaseRateChangePct: number;
  gmvPerActiveUser: number;
  gmvPerActiveUserChangePct: number;
  avgLifetimeValue: number;
  totalUsers: number;
};

function trendFor(changePct: number): DashboardMetric["trend"] {
  if (changePct > 0) return "up";
  if (changePct < 0) return "down";
  return "flat";
}

/** Maps the raw metrics response into the six `DashboardMetric` cards the
 * analytics page renders, formatting values for display. */
export function toUserAnalyticsMetrics(
  metrics: UserAnalyticsMetrics,
  formatMoney: (rupees: number) => string,
  formatNumber: (value: number) => string,
): DashboardMetric[] {
  const activeOrderedPct =
    metrics.totalUsers === 0
      ? 0
      : Math.round((metrics.activeOrderedCount / metrics.totalUsers) * 1000) /
        10;
  const activeSessionPct =
    metrics.totalUsers === 0
      ? 0
      : Math.round((metrics.activeSessionCount / metrics.totalUsers) * 1000) /
        10;

  return [
    {
      id: "active-ordered",
      label: "Active (ordered, 30d)",
      value: formatNumber(metrics.activeOrderedCount),
      changePct: metrics.activeOrderedChangePct,
      trend: trendFor(metrics.activeOrderedChangePct),
      hint: `% of total: ${activeOrderedPct}%`,
    },
    {
      id: "active-session",
      label: "Active (session, 30d)",
      value: formatNumber(metrics.activeSessionCount),
      changePct: metrics.activeSessionChangePct,
      trend: trendFor(metrics.activeSessionChangePct),
      hint: `% of total: ${activeSessionPct}%`,
    },
    {
      id: "repeat-purchase-rate",
      label: "Repeat purchase rate",
      value: `${metrics.repeatPurchaseRatePct}%`,
      changePct: metrics.repeatPurchaseRateChangePct,
      trend: trendFor(metrics.repeatPurchaseRateChangePct),
      hint: "2+ orders / active users",
    },
    {
      id: "gmv-per-active-user",
      label: "GMV per active user",
      value: formatMoney(metrics.gmvPerActiveUser),
      changePct: metrics.gmvPerActiveUserChangePct,
      trend: trendFor(metrics.gmvPerActiveUserChangePct),
      hint: "last 30 days",
    },
    {
      id: "avg-ltv",
      label: "Avg. lifetime value",
      value: formatMoney(metrics.avgLifetimeValue),
      changePct: 0,
      trend: "flat",
      hint: "all-time, per user",
    },
  ];
}
