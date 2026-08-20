import { apiRequest } from "@/core/api/client";
import {
  ORDER_STATUS_META,
  type OrderStatus,
  PAYMENT_METHOD_LABELS,
} from "@/modules/orders";
import { ageInMonths, getUsersGrowth, listUsers } from "@/modules/users";
import {
  bucketBabyAges,
  type OverviewAnalytics,
  type RecentUserRow,
} from "../data/overview-analytics-data";

type UserCounts = {
  totalUsers: number;
  newUsers: number;
  newUsersChangePct: number;
};

type OrderAnalytics = {
  totalRevenue: number;
  totalOrders: number;
  aov: number;
  revenueTrend: { date: string; revenue: number; orders: number }[];
  orderStatus: { status: string; count: number }[];
  hubRevenue: {
    hubId: string;
    hubName: string;
    revenue: number;
    orders: number;
  }[];
  paymentMethod: { method: string; count: number }[];
};

type CategorySalesPoint = { name: string; value: number };

function getUserCounts(): Promise<UserCounts> {
  return apiRequest<UserCounts>("/dashboard/user-counts");
}

function getRecentUsers(): Promise<RecentUserRow[]> {
  return apiRequest<RecentUserRow[]>("/dashboard/recent-users");
}

function getOrderAnalytics(range: {
  from: string;
  to: string;
}): Promise<OrderAnalytics> {
  return apiRequest<OrderAnalytics>("/dashboard/analytics", {
    query: range,
  });
}

function getCategorySales(): Promise<CategorySalesPoint[]> {
  return apiRequest<CategorySalesPoint[]>("/dashboard/category-sales");
}

function formatMoney(rupees: number): string {
  return `₹${rupees.toLocaleString("en-IN")}`;
}

/** Sampled from the first page — enough to shape a directional distribution
 * without pulling every customer record for a chart. */
const BABY_AGE_SAMPLE_SIZE = 100;

async function getBabyAgeBuckets() {
  const page = await listUsers({
    page: 1,
    limit: BABY_AGE_SAMPLE_SIZE,
    sortBy: "joinedAt",
    sortDir: "desc",
  });
  const ages = page.data.flatMap((user) =>
    user.babies.map((baby) => ageInMonths(baby.dob)),
  );
  return bucketBabyAges(ages);
}

/**
 * Cross-domain business overview for the range picked in the UI. Revenue,
 * order counts, order status, category/hub/payment breakdowns, total users,
 * user growth, recent signups, and baby-age buckets are all real, sourced
 * from `GET /admin/v1/dashboard/analytics` + `/category-sales` +
 * `/user-counts` + `/recent-users` + `/users/growth`.
 *
 * Category sales are all-time (that endpoint has no range filter) — every
 * other series is scoped to the picked `from`/`to`.
 */
export async function getOverviewAnalytics(range: {
  from: string;
  to: string;
}): Promise<OverviewAnalytics> {
  const [
    userCounts,
    userGrowth,
    recentUsers,
    babyAgeBuckets,
    orderAnalytics,
    categorySales,
  ] = await Promise.all([
    getUserCounts(),
    getUsersGrowth(range),
    getRecentUsers(),
    getBabyAgeBuckets(),
    getOrderAnalytics(range),
    getCategorySales(),
  ]);

  return {
    metrics: [
      {
        id: "revenue",
        label: "Revenue",
        value: formatMoney(orderAnalytics.totalRevenue),
        hint: "in selected range",
      },
      {
        id: "orders",
        label: "Orders",
        value: orderAnalytics.totalOrders.toLocaleString("en-IN"),
        hint: "in selected range",
      },
      {
        id: "aov",
        label: "Average order value",
        value: formatMoney(orderAnalytics.aov),
        hint: "in selected range",
      },
      {
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
      },
    ],
    revenue: orderAnalytics.revenueTrend,
    orderStatus: orderAnalytics.orderStatus.map((row) => ({
      status: row.status,
      label: ORDER_STATUS_META[row.status as OrderStatus]?.label ?? row.status,
      count: row.count,
    })),
    categoryRevenue: categorySales,
    hubRevenue: orderAnalytics.hubRevenue.map((row) => ({
      hub: row.hubName,
      revenue: row.revenue,
      orders: row.orders,
    })),
    paymentMode: orderAnalytics.paymentMethod.map((row) => ({
      mode: row.method,
      label: PAYMENT_METHOD_LABELS[row.method] ?? row.method,
      count: row.count,
    })),
    userGrowth,
    babyAgeBuckets,
    recentUsers,
  };
}
