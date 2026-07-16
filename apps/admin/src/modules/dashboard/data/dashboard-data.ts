/** Ops overview metrics — api-plan §15a `GET /admin/dashboard`. */

export type MetricTrend = "up" | "down" | "flat";

export type DashboardMetric = {
  id: string;
  label: string;
  /** Pre-formatted for display; the real endpoint returns raw + formatted. */
  value: string;
  /** Percentage change vs the previous period. */
  changePct: number;
  trend: MetricTrend;
  hint: string;
};

export type DashboardSummary = {
  metrics: DashboardMetric[];
  lowStockCount: number;
  pendingRefunds: number;
  openTickets: number;
  slaBreaches: number;
};

export const dashboardSummary: DashboardSummary = {
  metrics: [
    {
      id: "gmv",
      label: "GMV (today)",
      value: "₹4,82,300",
      changePct: 12.4,
      trend: "up",
      hint: "vs yesterday",
    },
    {
      id: "orders",
      label: "Orders (today)",
      value: "612",
      changePct: 8.1,
      trend: "up",
      hint: "vs yesterday",
    },
    {
      id: "aov",
      label: "Average order value",
      value: "₹788",
      changePct: -2.3,
      trend: "down",
      hint: "vs yesterday",
    },
    {
      id: "new-users",
      label: "New customers",
      value: "94",
      changePct: 0,
      trend: "flat",
      hint: "vs yesterday",
    },
  ],
  lowStockCount: 2,
  pendingRefunds: 3,
  openTickets: 7,
  slaBreaches: 1,
};
