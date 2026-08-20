/** Ops overview metrics — api-plan §15a `GET /admin/dashboard`. */

export type MetricTrend = "up" | "down" | "flat";

export type DashboardMetric = {
  id: string;
  label: string;
  /** Pre-formatted for display; the real endpoint returns raw + formatted. */
  value: string;
  /** Percentage change vs the previous period. Omitted where there's no real
   * previous-period comparison to show (e.g. an arbitrary date range). */
  changePct?: number;
  trend?: MetricTrend;
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
  /** Real — `GET /dashboard/attention`. */
  lowStockCount: number;
  /** Real — `GET /dashboard/attention`. */
  pendingRefunds: number;
  /** Real — `GET /dashboard/orders`. */
  salesData: SalesChartPoint[];
  /** Real — `GET /dashboard/category-sales`. */
  categoryData: CategorySalesPoint[];
  /** Real — `GET /dashboard/orders`. */
  recentOrders: RecentOrder[];
  /** Real — `GET /dashboard/recent-users`. */
  recentMoms: RecentUser[];
};

/** Real data — `GET /dashboard/user-counts`. Mirrors the server's response schema. */
export type UserCounts = {
  totalUsers: number;
  newUsers: number;
  newUsersChangePct: number;
};
