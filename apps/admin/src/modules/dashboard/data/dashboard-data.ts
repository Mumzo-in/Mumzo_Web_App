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

export type RecentOrder = {
  id: string;
  customerName: string;
  babyName?: string;
  babyAge?: string;
  itemsSummary: string;
  total: string;
  status:
    | "pending"
    | "confirmed"
    | "packed"
    | "shipped"
    | "delivered"
    | "cancelled";
  createdAt: string;
  slaBreach: boolean;
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
  metrics: [
    {
      id: "gmv",
      label: "GMV (today)",
      value: "₹4,82,300",
      changePct: 12.4,
      trend: "up",
      hint: "vs yesterday",
    },
    {
      id: "orders",
      label: "Orders (today)",
      value: "612",
      changePct: 8.1,
      trend: "up",
      hint: "vs yesterday",
    },
    {
      id: "aov",
      label: "Average order value",
      value: "₹788",
      changePct: -2.3,
      trend: "down",
      hint: "vs yesterday",
    },
    // "new-users" is intentionally absent from mock data — it's always
    // supplied by the real `GET /dashboard/user-counts` endpoint.
  ],
  lowStockCount: 2,
  pendingRefunds: 3,
  openTickets: 7,
  slaBreaches: 1,
  salesData: [
    { date: "Mon", revenue: 210000, orders: 280 },
    { date: "Tue", revenue: 280000, orders: 360 },
    { date: "Wed", revenue: 260000, orders: 330 },
    { date: "Thu", revenue: 320000, orders: 410 },
    { date: "Fri", revenue: 340000, orders: 430 },
    { date: "Sat", revenue: 450000, orders: 580 },
    { date: "Sun", revenue: 482300, orders: 612 },
  ],
  categoryData: [
    { name: "Diapers & Wipes", value: 185000 },
    { name: "Baby Formula & Food", value: 142000 },
    { name: "Bath & Skincare", value: 78000 },
    { name: "Toys & Accessories", value: 45300 },
    { name: "Maternity Care", value: 32000 },
  ],
  recentOrders: [
    {
      id: "ORD-9821",
      customerName: "Ananya Rao",
      babyName: "Kabir",
      babyAge: "8 months",
      itemsSummary:
        "Pampers Premium Active Baby (M, 76) × 1, Cerelac Stage 2 (Wheat Apple) × 2",
      total: "₹2,140",
      status: "confirmed",
      createdAt: "10 mins ago",
      slaBreach: false,
    },
    {
      id: "ORD-9820",
      customerName: "Priyanka Reddy",
      babyName: "Kiara",
      babyAge: "3 months",
      itemsSummary:
        "Huggies Wonder Pants (S, 86) × 1, Sebamed Baby Lotion (200ml) × 1",
      total: "₹1,850",
      status: "packed",
      createdAt: "18 mins ago",
      slaBreach: false,
    },
    {
      id: "ORD-9819",
      customerName: "Meera Nair",
      babyName: "Arjun",
      babyAge: "14 months",
      itemsSummary:
        "Aptamil Stage 3 (400g) × 3, Chicco Soft Cleansing Wipes (80s) × 4",
      total: "₹3,420",
      status: "shipped",
      createdAt: "24 mins ago",
      slaBreach: false,
    },
    {
      id: "ORD-9818",
      customerName: "Sana Khan",
      babyName: "Zara",
      babyAge: "6 months",
      itemsSummary:
        "MamyPoko Extra Soft Pants (M, 74) × 2, Johnson's Baby Powder (500g) × 1",
      total: "₹1,980",
      status: "pending",
      createdAt: "35 mins ago",
      slaBreach: true,
    },
    {
      id: "ORD-9817",
      customerName: "Deepika Sen",
      babyName: "Aarav",
      babyAge: "18 months",
      itemsSummary:
        "Enfamil A+ Stage 4 (400g) × 1, Pigeon Baby Liquid Cleanser × 1",
      total: "₹1,250",
      status: "delivered",
      createdAt: "1 hour ago",
      slaBreach: false,
    },
  ],
  // Always overwritten by the real `GET /dashboard/recent-users` response.
  recentMoms: [],
};
