import { apiRequest } from "@/core/api/client";
import { mockDetail } from "@/core/api/mock";
import {
  type DashboardMetric,
  type DashboardSummary,
  dashboardSummary,
  type RecentUser,
  type UserCounts,
} from "../data/dashboard-data";

function getUserCounts(): Promise<UserCounts> {
  return apiRequest<UserCounts>("/dashboard/user-counts");
}

function toNewUsersMetric(userCounts: UserCounts): DashboardMetric {
  return {
    id: "new-users",
    label: "New customers",
    value: userCounts.newUsers.toLocaleString("en-IN"),
    changePct: userCounts.newUsersChangePct,
    trend:
      userCounts.newUsersChangePct > 0
        ? "up"
        : userCounts.newUsersChangePct < 0
          ? "down"
          : "flat",
    hint: `${userCounts.totalUsers.toLocaleString("en-IN")} total · vs prior 24h`,
  };
}

function getRecentUsers(): Promise<RecentUser[]> {
  return apiRequest<RecentUser[]>("/dashboard/recent-users");
}

const joinedAtFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
});

function formatJoinedAt(recentUser: RecentUser): RecentUser {
  return {
    ...recentUser,
    joinedAt: joinedAtFormatter.format(new Date(recentUser.joinedAt)),
  };
}

/**
 * Dashboard API — api-plan §15a.
 *
 * User counts and the "New Momzos" list are wired to real endpoints
 * (`GET /dashboard/user-counts`, `GET /dashboard/recent-users`); everything
 * else still resolves against mock data and swaps to
 * `apiRequest<DashboardSummary>("/dashboard")` once that endpoint lands.
 */
export async function getDashboard(): Promise<DashboardSummary> {
  const [summary, userCounts, recentUsers] = await Promise.all([
    mockDetail(dashboardSummary),
    getUserCounts(),
    getRecentUsers(),
  ]);

  return {
    ...summary,
    metrics: [...summary.metrics, toNewUsersMetric(userCounts)],
    recentMoms: recentUsers.map(formatJoinedAt),
  };
}
