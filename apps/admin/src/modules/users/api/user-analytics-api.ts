import { apiRequest } from "@/core/api/client";
import type { DashboardMetric } from "@/modules/dashboard";
import {
  type RetentionPoint,
  toUserAnalyticsMetrics,
  type UserAnalyticsMetrics,
  type UserAnalyticsSummary,
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

function getAnalyticsMetrics(range?: {
  from: string;
  to: string;
}): Promise<UserAnalyticsMetrics> {
  return apiRequest<UserAnalyticsMetrics>("/users/analytics/metrics", {
    query: range,
  });
}

function getOrderRetention(): Promise<RetentionPoint[]> {
  return apiRequest<RetentionPoint[]>("/users/analytics/retention");
}

const INR = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});
const NUM = new Intl.NumberFormat("en-IN");

/**
 * User analytics — every number here is real, computed server-side from
 * `order`/`session`/`user` (see `apps/server/.../users/users.repo.ts`).
 * `Total users` and the growth chart resolve against dedicated dashboard
 * endpoints; the five metric cards and the retention curve come from
 * `GET /users/analytics/metrics` and `GET /users/analytics/retention`.
 */
export async function getUserAnalytics(range?: {
  from: string;
  to: string;
}): Promise<UserAnalyticsSummary> {
  const [userCounts, growth, rawMetrics, retention] = await Promise.all([
    getUserCounts(),
    getUsersGrowth(range),
    getAnalyticsMetrics(range),
    getOrderRetention(),
  ]);

  return {
    metrics: [
      toTotalUsersMetric(userCounts),
      ...toUserAnalyticsMetrics(
        rawMetrics,
        (rupees) => INR.format(rupees),
        (value) => NUM.format(value),
      ),
    ],
    growth,
    retention,
  };
}
