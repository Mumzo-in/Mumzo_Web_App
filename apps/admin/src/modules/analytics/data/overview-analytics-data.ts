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

export type OverviewAnalytics = {
  metrics: DashboardMetric[];
  revenue: RevenuePoint[];
  orderStatus: OrderStatusPoint[];
  categoryRevenue: CategoryRevenuePoint[];
  hubRevenue: HubPoint[];
  paymentMode: PaymentModePoint[];
  slaBreachPct: number;
  /** Real — from `GET /users/growth`. */
  userGrowth: { date: string; newUsers: number; totalUsers: number }[];
  /** Mock — no `order` table to compute a real repeat-purchase split. */
  newVsReturning: NewVsReturningPoint[];
  /** Real — bucketed from actual customer-directory baby DOBs. */
  babyAgeBuckets: BabyAgeBucket[];
  /** Real — `GET /dashboard/recent-users`. */
  recentUsers: RecentUserRow[];
};

/**
 * No `order` table exists yet, so revenue/order counts are seeded
 * deterministically from the date range rather than a real query — same
 * mock-data seam every other module in this app uses. `dailySeed` keeps the
 * numbers stable across re-renders (no `Math.random()` jitter on refetch).
 */
function dailySeed(dateKey: string): number {
  let hash = 0;
  for (let i = 0; i < dateKey.length; i++) {
    hash = (hash * 31 + dateKey.charCodeAt(i)) % 100000;
  }
  return hash;
}

function eachDay(from: string, to: string): string[] {
  const days: string[] = [];
  const cursor = new Date(`${from}T00:00:00.000Z`);
  const end = new Date(`${to}T00:00:00.000Z`);
  while (cursor.getTime() <= end.getTime()) {
    days.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return days;
}

export function buildMockRevenue(from: string, to: string): RevenuePoint[] {
  return eachDay(from, to).map((date) => {
    const seed = dailySeed(date);
    const orders = 220 + (seed % 180);
    const avgOrderValue = 650 + (seed % 400);
    return { date, revenue: orders * avgOrderValue, orders };
  });
}

const CATEGORY_NAMES = [
  "Diapers & Wipes",
  "Baby Formula & Food",
  "Bath & Skincare",
  "Toys & Accessories",
  "Maternity Care",
];

export function buildMockCategoryRevenue(
  revenue: RevenuePoint[],
): CategoryRevenuePoint[] {
  const total = revenue.reduce((sum, point) => sum + point.revenue, 0);
  const weights = [0.34, 0.26, 0.17, 0.14, 0.09];
  return CATEGORY_NAMES.map((name, index) => ({
    name,
    value: Math.round(total * (weights[index] ?? 0)),
  }));
}

const ORDER_STATUS_WEIGHTS: {
  status: string;
  label: string;
  weight: number;
}[] = [
  { status: "placed", label: "Placed", weight: 0.08 },
  { status: "packed", label: "Packed", weight: 0.06 },
  { status: "out_for_delivery", label: "Out for delivery", weight: 0.05 },
  { status: "delivered", label: "Delivered", weight: 0.78 },
  { status: "cancelled", label: "Cancelled", weight: 0.03 },
];

export function buildMockOrderStatus(
  revenue: RevenuePoint[],
): OrderStatusPoint[] {
  const totalOrders = revenue.reduce((sum, point) => sum + point.orders, 0);
  return ORDER_STATUS_WEIGHTS.map(({ status, label, weight }) => ({
    status,
    label,
    count: Math.round(totalOrders * weight),
  }));
}

/** Matches the hub names used in `modules/orders`'s mock data. */
const HUB_WEIGHTS = [
  { hub: "Jubilee Hills", weight: 0.36 },
  { hub: "Gachibowli", weight: 0.34 },
  { hub: "Kondapur", weight: 0.3 },
];

export function buildMockHubRevenue(revenue: RevenuePoint[]): HubPoint[] {
  const totalRevenue = revenue.reduce((sum, point) => sum + point.revenue, 0);
  const totalOrders = revenue.reduce((sum, point) => sum + point.orders, 0);
  return HUB_WEIGHTS.map(({ hub, weight }) => ({
    hub,
    revenue: Math.round(totalRevenue * weight),
    orders: Math.round(totalOrders * weight),
  }));
}

const PAYMENT_MODE_WEIGHTS: { mode: string; label: string; weight: number }[] =
  [
    { mode: "upi", label: "UPI", weight: 0.44 },
    { mode: "cod", label: "Cash on delivery", weight: 0.28 },
    { mode: "card", label: "Card", weight: 0.18 },
    { mode: "wallet", label: "Wallet", weight: 0.1 },
  ];

export function buildMockPaymentMode(
  revenue: RevenuePoint[],
): PaymentModePoint[] {
  const totalOrders = revenue.reduce((sum, point) => sum + point.orders, 0);
  return PAYMENT_MODE_WEIGHTS.map(({ mode, label, weight }) => ({
    mode,
    label,
    count: Math.round(totalOrders * weight),
  }));
}

/**
 * Deterministic SLA-breach % seeded off the range's first day — a plain
 * constant would look identical for every range, this at least varies with
 * the selected window like the other mock series do.
 */
export function buildMockSlaBreachPct(from: string): number {
  const seed = dailySeed(from);
  return Math.round((3 + (seed % 6)) * 10) / 10;
}

export type NewVsReturningPoint = {
  segment: string;
  label: string;
  count: number;
};

/**
 * New vs. returning split needs order history to compute for real — there's
 * no `order` table, so this stays a mock ratio seeded from the range like
 * everything else here. Not derived from `userGrowth` (that's real) to
 * avoid implying the split itself is real.
 */
export function buildMockNewVsReturning(
  from: string,
  totalUsers: number,
): NewVsReturningPoint[] {
  const seed = dailySeed(from);
  const returningShare = 0.55 + (seed % 20) / 100;
  const returning = Math.round(totalUsers * returningShare);
  return [
    { segment: "new", label: "New", count: totalUsers - returning },
    { segment: "returning", label: "Returning", count: returning },
  ];
}

export type BabyAgeBucket = {
  bucket: string;
  count: number;
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
