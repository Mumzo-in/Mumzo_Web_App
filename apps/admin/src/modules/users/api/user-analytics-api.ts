import { apiRequest } from "@/core/api/client";
import { mockDetail } from "@/core/api/mock";
import type { DashboardMetric } from "@/modules/dashboard";
import {
  type UserAnalyticsSummary,
  userAnalyticsSummary,
} from "../data/user-analytics-data";
import { getUsersGrowth } from "./users-api";

type UserCounts = {
  totalUsers: number;
  newUsers: number;
  newUsersChangePct: number;
};

function getUserCounts(): Promise<UserCounts> {
  return apiRequest<UserCounts>("/dashboard/user-counts");
}

function toTotalUsersMetric(userCounts: UserCounts): DashboardMetric {
  return {
    id: "total-users",
    label: "Total users",
    value: userCounts.totalUsers.toLocaleString("en-IN"),
    changePct: userCounts.newUsersChangePct,
    trend:
      userCounts.newUsersChangePct > 0
        ? "up"
        : userCounts.newUsersChangePct < 0
          ? "down"
          : "flat",
    hint: `${userCounts.newUsers.toLocaleString("en-IN")} new in last 24h`,
  };
}

/**
 * User analytics API — spec'd at api-plan `GET /admin/analytics/users`
 * (signups, retention, cohort data), not fully built server-side yet.
 *
 * `Total users` metric and the growth chart are real (`GET
 * /dashboard/user-counts`, `GET /users/growth`); the remaining metrics and
 * the retention curve still resolve against mock data until an `order`
 * table exists to compute them honestly.
 */
export async function getUserAnalytics(range?: {
  from: string;
  to: string;
}): Promise<UserAnalyticsSummary> {
  const [summary, userCounts, growth] = await Promise.all([
    mockDetail(userAnalyticsSummary),
    getUserCounts(),
    getUsersGrowth(range),
  ]);

  return {
    ...summary,
    metrics: summary.metrics.map((metric) =>
      metric.id === "total-users" ? toTotalUsersMetric(userCounts) : metric,
    ),
    growth,
  };
}
