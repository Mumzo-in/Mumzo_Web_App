import { apiRequest } from "@/core/api/client";
import { mockDetail } from "@/core/api/mock";
import {
  type DashboardMetric,
  type DashboardSummary,
  dashboardSummary,
  type OrderDashboard,
  type RecentUser,
  type UserCounts,
} from "../data/dashboard-data";

function getOrderDashboard(): Promise<OrderDashboard> {
  return apiRequest<OrderDashboard>("/dashboard/orders");
}

function toOrderMetrics(order: OrderDashboard): DashboardMetric[] {
  const { metrics } = order;
  return [
    {
      id: "gmv",
      label: "GMV (24h)",
      value: `₹${metrics.gmv.toLocaleString("en-IN")}`,
      changePct: metrics.gmvChangePct,
      trend:
        metrics.gmvChangePct > 0
          ? "up"
          : metrics.gmvChangePct < 0
            ? "down"
            : "flat",
      hint: "vs prior 24h",
    },
    {
      id: "orders",
      label: "Orders (24h)",
      value: metrics.orders.toLocaleString("en-IN"),
      changePct: metrics.ordersChangePct,
      trend:
        metrics.ordersChangePct > 0
          ? "up"
          : metrics.ordersChangePct < 0
            ? "down"
            : "flat",
      hint: "vs prior 24h",
    },
    {
      id: "aov",
      label: "Average order value",
      value: `₹${metrics.aov.toLocaleString("en-IN")}`,
      changePct: metrics.aovChangePct,
      trend:
        metrics.aovChangePct > 0
          ? "up"
          : metrics.aovChangePct < 0
            ? "down"
            : "flat",
      hint: "vs prior 24h",
    },
  ];
}

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
 * User counts, the "New Momzos" list, and all order-derived numbers (GMV,
 * order count, AOV, revenue trend, recent orders) are wired to real
 * endpoints. Only `lowStockCount`/`pendingRefunds`/`openTickets`/
 * `slaBreaches`/`categoryData` (no category-attribution data yet) still
 * resolve against mock data.
 */
export async function getDashboard(): Promise<DashboardSummary> {
  const [summary, userCounts, recentUsers, orders] = await Promise.all([
    mockDetail(dashboardSummary),
    getUserCounts(),
    getRecentUsers(),
    getOrderDashboard(),
  ]);

  return {
    ...summary,
    metrics: [...toOrderMetrics(orders), toNewUsersMetric(userCounts)],
    salesData: orders.revenueTrend,
    recentOrders: orders.recentOrders,
    recentMoms: recentUsers.map(formatJoinedAt),
  };
}
