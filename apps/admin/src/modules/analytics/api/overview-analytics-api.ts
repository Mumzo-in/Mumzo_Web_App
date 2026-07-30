import { apiRequest } from "@/core/api/client";
import { ageInMonths, getUsersGrowth, listUsers } from "@/modules/users";
import {
  bucketBabyAges,
  buildMockCategoryRevenue,
  buildMockHubRevenue,
  buildMockNewVsReturning,
  buildMockOrderStatus,
  buildMockPaymentMode,
  buildMockRevenue,
  buildMockSlaBreachPct,
  type OverviewAnalytics,
  type RecentUserRow,
} from "../data/overview-analytics-data";

type UserCounts = {
  totalUsers: number;
  newUsers: number;
  newUsersChangePct: number;
};

function getUserCounts(): Promise<UserCounts> {
  return apiRequest<UserCounts>("/dashboard/user-counts");
}

function getRecentUsers(): Promise<RecentUserRow[]> {
  return apiRequest<RecentUserRow[]>("/dashboard/recent-users");
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
 * Cross-domain business overview — spec'd at api-plan `GET /admin/analytics`
 * (revenue, orders, users combined), not built server-side.
 *
 * User growth, total-users metric, recent signups, and baby-age buckets are
 * real; revenue/order/category/hub/payment/SLA numbers are deterministic
 * mock data seeded from the date range — there's no `order` table yet, so
 * nothing here is fabricated as if it were live.
 */
export async function getOverviewAnalytics(range: {
  from: string;
  to: string;
}): Promise<OverviewAnalytics> {
  const [userCounts, userGrowth, recentUsers, babyAgeBuckets] =
    await Promise.all([
      getUserCounts(),
      getUsersGrowth(range),
      getRecentUsers(),
      getBabyAgeBuckets(),
    ]);

  const revenue = buildMockRevenue(range.from, range.to);
  const totalRevenue = revenue.reduce((sum, point) => sum + point.revenue, 0);
  const totalOrders = revenue.reduce((sum, point) => sum + point.orders, 0);
  const aov = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

  return {
    metrics: [
      {
        id: "revenue",
        label: "Revenue",
        value: formatMoney(totalRevenue),
        changePct: 8.4,
        trend: "up",
        hint: "vs previous period",
      },
      {
        id: "orders",
        label: "Orders",
        value: totalOrders.toLocaleString("en-IN"),
        changePct: 5.1,
        trend: "up",
        hint: "vs previous period",
      },
      {
        id: "aov",
        label: "Average order value",
        value: formatMoney(aov),
        changePct: -1.6,
        trend: "down",
        hint: "vs previous period",
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
    revenue,
    orderStatus: buildMockOrderStatus(revenue),
    categoryRevenue: buildMockCategoryRevenue(revenue),
    hubRevenue: buildMockHubRevenue(revenue),
    paymentMode: buildMockPaymentMode(revenue),
    slaBreachPct: buildMockSlaBreachPct(range.from),
    userGrowth,
    newVsReturning: buildMockNewVsReturning(range.from, userCounts.totalUsers),
    babyAgeBuckets,
    recentUsers,
  };
}
