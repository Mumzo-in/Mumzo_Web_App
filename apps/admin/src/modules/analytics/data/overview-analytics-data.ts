import type { DashboardMetric } from "@/modules/dashboard";

export type RevenuePoint = {
  date: string;
  revenue: number;
  orders: number;
};

export type OrderStatusPoint = {
  status: string;
  label: string;
  count: number;
};

export type CategoryRevenuePoint = {
  name: string;
  value: number;
};

export type HubPoint = {
  hub: string;
  revenue: number;
  orders: number;
};

export type PaymentModePoint = {
  mode: string;
  label: string;
  count: number;
};

export type RecentUserRow = {
  id: string;
  name: string;
  phoneNumber: string | null;
  babyName: string | null;
  babyAge: string | null;
  joinedAt: string;
};

export type BabyAgeBucket = {
  bucket: string;
  count: number;
};

export type OverviewAnalytics = {
  metrics: DashboardMetric[];
  revenue: RevenuePoint[];
  orderStatus: OrderStatusPoint[];
  /** All-time — the category-sales endpoint isn't range-filtered. */
  categoryRevenue: CategoryRevenuePoint[];
  hubRevenue: HubPoint[];
  paymentMode: PaymentModePoint[];
  /** Real — from `GET /users/growth`. */
  userGrowth: { date: string; newUsers: number; totalUsers: number }[];
  /** Real — bucketed from actual customer-directory baby DOBs. */
  babyAgeBuckets: BabyAgeBucket[];
  /** Real — `GET /dashboard/recent-users`. */
  recentUsers: RecentUserRow[];
};

const AGE_BUCKETS: { label: string; maxMonths: number }[] = [
  { label: "0–3m", maxMonths: 3 },
  { label: "4–6m", maxMonths: 6 },
  { label: "7–12m", maxMonths: 12 },
  { label: "13–24m", maxMonths: 24 },
  { label: "25m+", maxMonths: Number.POSITIVE_INFINITY },
];

/** Real — buckets actual baby DOBs (from the customer directory) by age. */
export function bucketBabyAges(ageMonths: number[]): BabyAgeBucket[] {
  return AGE_BUCKETS.map((bucket, index) => {
    const min = index === 0 ? 0 : (AGE_BUCKETS[index - 1]?.maxMonths ?? 0);
    return {
      bucket: bucket.label,
      count: ageMonths.filter((age) => age > min && age <= bucket.maxMonths)
        .length,
    };
  });
}
