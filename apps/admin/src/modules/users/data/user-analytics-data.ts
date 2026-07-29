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

export const userAnalyticsSummary: UserAnalyticsSummary = {
  metrics: [
    // Placeholder — always overwritten by the real `GET /dashboard/user-counts`
    // response in `api/user-analytics-api.ts`. Kept as an entry so the map
    // that swaps it in has something to find by id.
    {
      id: "total-users",
      label: "Total users",
      value: "3,214",
      changePct: 6.8,
      trend: "up",
      hint: "vs last 30 days",
    },
    {
      id: "active-ordered",
      label: "Active (ordered, 30d)",
      value: "1,042",
      changePct: 4.1,
      trend: "up",
      hint: "% of total: 32%",
    },
    {
      id: "active-session",
      label: "Active (session, 30d)",
      value: "1,890",
      changePct: 2.3,
      trend: "up",
      hint: "% of total: 59%",
    },
    {
      id: "repeat-purchase-rate",
      label: "Repeat purchase rate",
      value: "38%",
      changePct: 1.5,
      trend: "up",
      hint: "2+ orders / active users",
    },
    {
      id: "gmv-per-active-user",
      label: "GMV per active user",
      value: "₹1,860",
      changePct: -1.2,
      trend: "down",
      hint: "last 30 days",
    },
    {
      id: "avg-ltv",
      label: "Avg. lifetime value",
      value: "₹4,120",
      changePct: 3.4,
      trend: "up",
      hint: "all-time, per user",
    },
  ],
  // Always overwritten by the real `GET /users/growth` response.
  growth: [],
  retention: [
    { month: 0, retentionPct: 100 },
    { month: 1, retentionPct: 54 },
    { month: 2, retentionPct: 41 },
    { month: 3, retentionPct: 33 },
    { month: 4, retentionPct: 29 },
    { month: 5, retentionPct: 26 },
    { month: 6, retentionPct: 24 },
  ],
};
