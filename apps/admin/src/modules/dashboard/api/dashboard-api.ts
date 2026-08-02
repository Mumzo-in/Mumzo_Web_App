import { apiRequest } from "@/core/api/client";
import type {
  CategorySalesPoint,
  DashboardMetric,
  DashboardSummary,
  OrderDashboard,
  RecentUser,
  UserCounts,
} from "../data/dashboard-data";

type AttentionCounts = {
  lowStockCount: number;
  pendingRefunds: number;
};

function getAttentionCounts(): Promise<AttentionCounts> {
  return apiRequest<AttentionCounts>("/dashboard/attention");
}

function getCategorySales(): Promise<CategorySalesPoint[]> {
  return apiRequest<CategorySalesPoint[]>("/dashboard/category-sales");
}

function getOrderDashboard(): Promise<OrderDashboard> {
  return apiRequest<OrderDashboard>("/dashboard/orders");
}

function toOrderMetrics(order: OrderDashboard): DashboardMetric[] {
  const { metrics } = order;
  return [
    {
      id: "gmv",
      label: "Total order value (today)",
      value: `₹${metrics.gmv.toLocaleString("en-IN")}`,
      changePct: metrics.gmvChangePct,
      trend:
        metrics.gmvChangePct > 0
          ? "up"
          : metrics.gmvChangePct < 0
            ? "down"
            : "flat",
      hint: "vs yesterday",
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
 * Dashboard API — api-plan §15a. Every field is backed by a real endpoint —
 * no mock data.
 */
export async function getDashboard(): Promise<DashboardSummary> {
  const [userCounts, recentUsers, orders, attention, categoryData] =
    await Promise.all([
      getUserCounts(),
      getRecentUsers(),
      getOrderDashboard(),
      getAttentionCounts(),
      getCategorySales(),
    ]);

  return {
    ...attention,
    metrics: [...toOrderMetrics(orders), toNewUsersMetric(userCounts)],
    salesData: orders.revenueTrend,
    categoryData,
    recentOrders: orders.recentOrders,
    recentMoms: recentUsers.map(formatJoinedAt),
  };
}
