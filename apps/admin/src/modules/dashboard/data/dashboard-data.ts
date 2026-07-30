/** Ops overview metrics — api-plan §15a `GET /admin/dashboard`. */

export type MetricTrend = "up" | "down" | "flat";

export type DashboardMetric = {
  id: string;
  label: string;
  /** Pre-formatted for display; the real endpoint returns raw + formatted. */
  value: string;
  /** Percentage change vs the previous period. */
  changePct: number;
  trend: MetricTrend;
  hint: string;
};

export type SalesChartPoint = {
  date: string;
  revenue: number;
  orders: number;
};

export type CategorySalesPoint = {
  name: string;
  value: number;
};

/** Real data — `GET /dashboard/orders`. Mirrors the server's response schema. */
export type RecentOrder = {
  id: string;
  customerName: string;
  itemCount: number;
  total: number;
  status: string;
  placedAt: string;
};

export type OrderMetrics = {
  gmv: number;
  gmvChangePct: number;
  orders: number;
  ordersChangePct: number;
  aov: number;
  aovChangePct: number;
};

export type OrderDashboard = {
  metrics: OrderMetrics;
  revenueTrend: SalesChartPoint[];
  recentOrders: RecentOrder[];
};

/** Real data — `GET /dashboard/recent-users`. Mirrors the server's response schema. */
export type RecentUser = {
  id: string;
  name: string;
  phoneNumber: string | null;
  babyName: string | null;
  babyAge: string | null;
  joinedAt: string;
  orderCount: number;
};

export type DashboardSummary = {
  metrics: DashboardMetric[];
  lowStockCount: number;
  pendingRefunds: number;
  openTickets: number;
  slaBreaches: number;
  salesData: SalesChartPoint[];
  categoryData: CategorySalesPoint[];
  recentOrders: RecentOrder[];
  /** Always real — `GET /dashboard/recent-users`; no mock fallback. */
  recentMoms: RecentUser[];
};

/** Real data — `GET /dashboard/user-counts`. Mirrors the server's response schema. */
export type UserCounts = {
  totalUsers: number;
  newUsers: number;
  newUsersChangePct: number;
};

export const dashboardSummary: DashboardSummary = {
  // "gmv"/"orders"/"aov"/"new-users" are intentionally absent — always
  // supplied by the real `GET /dashboard/orders` and `/dashboard/user-counts`
  // endpoints.
  metrics: [],
  lowStockCount: 2,
  pendingRefunds: 3,
  openTickets: 7,
  slaBreaches: 1,
  // Always overwritten by the real `GET /dashboard/orders` response.
  salesData: [],
  categoryData: [
    { name: "Diapers & Wipes", value: 185000 },
    { name: "Baby Formula & Food", value: 142000 },
    { name: "Bath & Skincare", value: 78000 },
    { name: "Toys & Accessories", value: 45300 },
    { name: "Maternity Care", value: 32000 },
  ],
  // Always overwritten by the real `GET /dashboard/orders` response.
  recentOrders: [],
  // Always overwritten by the real `GET /dashboard/recent-users` response.
  recentMoms: [],
};
