/**
 * Query key factory — every admin query key is built here so invalidation
 * targets are greppable and consistent.
 *
 * Convention: [domain, entity?, params?]
 *   ["products"]                     → all product queries
 *   ["products", "list", { page }]   → one page of the list
 *   ["products", "detail", id]       → one product
 *
 * Invalidating ["products"] after a mutation refreshes list + detail together.
 */

export type ListParams = Record<string, string | number | boolean | undefined>;

function domainKeys<D extends string>(domain: D) {
  return {
    all: [domain] as const,
    lists: () => [domain, "list"] as const,
    list: (params: ListParams = {}) => [domain, "list", params] as const,
    details: () => [domain, "detail"] as const,
    detail: (id: string) => [domain, "detail", id] as const,
  };
}

export const queryKeys = {
  dashboard: {
    all: ["dashboard"] as const,
    overview: () => ["dashboard", "overview"] as const,
    analytics: (metric: string) => ["dashboard", "analytics", metric] as const,
  },
  overviewAnalytics: {
    range: (range: { from: string; to: string }) =>
      ["overview-analytics", range] as const,
  },
  products: domainKeys("products"),
  brands: domainKeys("brands"),
  vendors: domainKeys("vendors"),
  bundles: domainKeys("bundles"),
  hubs: domainKeys("hubs"),
  serviceAreas: domainKeys("service-areas"),
  inventory: domainKeys("inventory"),
  /** Categories are keyed by slug, not id (api-plan §15c). */
  categories: {
    ...domainKeys("categories"),
    detail: (slug: string) => ["categories", "detail", slug] as const,
  },
  orders: domainKeys("orders"),
  users: {
    ...domainKeys("users"),
    analytics: (range?: { from: string; to: string }) =>
      ["users", "analytics", range ?? {}] as const,
  },
  payments: {
    ...domainKeys("payments"),
    failed: () => ["payments", "failed"] as const,
  },
  coupons: {
    ...domainKeys("coupons"),
    usage: (id: string) => ["coupons", "usage", id] as const,
  },
  reviews: domainKeys("reviews"),
  subscriptions: {
    ...domainKeys("subscriptions"),
    upcoming: () => ["subscriptions", "upcoming"] as const,
  },
  staff: domainKeys("staff"),
  broadcasts: domainKeys("broadcasts"),
  cmsPages: domainKeys("cms-pages"),
  referrals: {
    config: () => ["referrals", "config"] as const,
    stats: () => ["referrals", "stats"] as const,
  },
} as const;
