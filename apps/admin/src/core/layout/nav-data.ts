import {
  Banknote,
  Blocks,
  LayoutDashboard,
  type LucideIcon,
  Package,
  Scale,
  ShieldCheck,
  Store,
  Users,
} from "lucide-react";

/**
 * Sidebar information architecture — the 20 feature modules of
 * docs/superadmin/features.md, arranged for the two-panel nav.
 *
 * The mini rail shows `NAV_SECTIONS` (icon + label). Selecting one reveals its
 * `items` in the secondary panel as a flat list — no accordions there, so every
 * page in a section is one click away once the section is picked.
 *
 * Serializable data fed to the nav as props, so this can be driven by
 * permissions (or remote config) later without touching the components.
 */

export type NavItem = {
  label: string;
  /** Matches a route in docs/superadmin/pages-spec.md. */
  to: string;
  /** Renders a "Soon" chip; these routes show ComingSoon. */
  comingSoon?: boolean;
};

/** An optional heading inside the secondary panel, grouping related items. */
export type NavItemGroup = {
  label: string;
  items: NavItem[];
};

export type NavSection = {
  id: string;
  label: string;
  icon: LucideIcon;
  /** Where the section lands when opened directly (deep-link resolution). */
  to: string;
  groups: NavItemGroup[];
};

export const NAV_SECTIONS: NavSection[] = [
  {
    id: "overview",
    label: "Overview",
    icon: LayoutDashboard,
    to: "/",
    groups: [
      {
        label: "Today",
        items: [
          { label: "Dashboard", to: "/" },
          { label: "Live ops board", to: "/overview/ops", comingSoon: true },
        ],
      },
      {
        label: "Reporting",
        items: [
          { label: "Analytics", to: "/overview/analytics", comingSoon: true },
          { label: "Analytics & BI", to: "/overview/bi", comingSoon: true },
        ],
      },
    ],
  },
  {
    id: "catalog",
    label: "Catalog",
    icon: Package,
    to: "/catalog/products",
    groups: [
      {
        label: "Products",
        items: [
          { label: "All products", to: "/catalog/products" },
          { label: "Add product", to: "/catalog/products/new" },
          {
            label: "Bulk import",
            to: "/catalog/products/bulk",
            comingSoon: true,
          },
        ],
      },
      {
        label: "Taxonomy",
        items: [
          { label: "Categories", to: "/catalog/categories" },
          { label: "Add category", to: "/catalog/categories/new" },
          { label: "Brands", to: "/catalog/brands", comingSoon: true },
          {
            label: "Collections",
            to: "/catalog/collections",
            comingSoon: true,
          },
        ],
      },
      {
        label: "Stock",
        items: [
          { label: "Inventory", to: "/catalog/inventory", comingSoon: true },
          {
            label: "Adjustments",
            to: "/catalog/inventory/adjustments",
            comingSoon: true,
          },
          {
            label: "Batches & expiry",
            to: "/catalog/inventory/batches",
            comingSoon: true,
          },
          { label: "Hubs", to: "/catalog/hubs", comingSoon: true },
        ],
      },
      {
        label: "Merchandising",
        items: [
          { label: "Pricing", to: "/catalog/pricing", comingSoon: true },
          {
            label: "Search & recs",
            to: "/catalog/merchandising",
            comingSoon: true,
          },
        ],
      },
    ],
  },
  {
    id: "operations",
    label: "Operations",
    icon: Store,
    to: "/operations/orders",
    groups: [
      {
        label: "Orders",
        items: [
          { label: "All orders", to: "/operations/orders" },
          { label: "Returns", to: "/operations/returns", comingSoon: true },
        ],
      },
      {
        label: "Fleet",
        items: [
          {
            label: "Dispatch board",
            to: "/operations/dispatch",
            comingSoon: true,
          },
          { label: "Riders", to: "/operations/riders", comingSoon: true },
        ],
      },
      {
        label: "Support",
        items: [
          { label: "Tickets", to: "/operations/tickets", comingSoon: true },
        ],
      },
    ],
  },
  {
    id: "customers",
    label: "Customers",
    icon: Users,
    to: "/customers/users",
    groups: [
      {
        label: "Accounts",
        items: [
          { label: "All customers", to: "/customers/users" },
          { label: "Segments", to: "/customers/segments", comingSoon: true },
        ],
      },
      {
        label: "Engagement",
        items: [
          {
            label: "Broadcasts",
            to: "/customers/broadcasts",
            comingSoon: true,
          },
          {
            label: "New broadcast",
            to: "/customers/broadcasts/new",
            comingSoon: true,
          },
          { label: "Journeys", to: "/customers/journeys", comingSoon: true },
        ],
      },
      {
        label: "Moderation",
        items: [
          { label: "Reviews", to: "/customers/reviews", comingSoon: true },
        ],
      },
    ],
  },
  {
    id: "finance",
    label: "Finance",
    icon: Banknote,
    to: "/finance/payments",
    groups: [
      {
        label: "Payments",
        items: [
          { label: "All payments", to: "/finance/payments" },
          { label: "Failed & pending", to: "/finance/payments/failed" },
        ],
      },
      {
        label: "Promotions",
        items: [
          { label: "Coupons", to: "/finance/coupons" },
          { label: "New coupon", to: "/finance/coupons/new" },
          { label: "Campaigns", to: "/finance/campaigns", comingSoon: true },
        ],
      },
      {
        label: "Accounting",
        items: [
          {
            label: "Reconciliation",
            to: "/finance/reconciliation",
            comingSoon: true,
          },
          { label: "Tax & invoicing", to: "/finance/tax", comingSoon: true },
        ],
      },
      {
        label: "Recurring",
        items: [
          {
            label: "Subscriptions",
            to: "/finance/subscriptions",
            comingSoon: true,
          },
          {
            label: "Upcoming deliveries",
            to: "/finance/subscriptions/upcoming",
            comingSoon: true,
          },
        ],
      },
    ],
  },
  {
    id: "legal",
    label: "Legal",
    icon: Scale,
    to: "/legal/pages",
    groups: [
      {
        label: "Pages",
        items: [{ label: "Legal & static pages", to: "/legal/pages" }],
      },
      {
        label: "Storefront content",
        items: [
          { label: "Banners", to: "/legal/banners", comingSoon: true },
          { label: "App config", to: "/legal/config", comingSoon: true },
        ],
      },
    ],
  },
  {
    id: "staff",
    label: "Staff",
    icon: ShieldCheck,
    to: "/staff",
    groups: [
      {
        label: "Access",
        items: [
          { label: "Staff & roles", to: "/staff", comingSoon: true },
          { label: "Audit log", to: "/staff/audit-log", comingSoon: true },
        ],
      },
    ],
  },
  {
    id: "platform",
    label: "Platform",
    icon: Blocks,
    to: "/platform/flags",
    groups: [
      {
        label: "Rollout",
        items: [
          { label: "Feature flags", to: "/platform/flags", comingSoon: true },
          {
            label: "Experiments",
            to: "/platform/experiments",
            comingSoon: true,
          },
        ],
      },
      {
        label: "Infrastructure",
        items: [
          {
            label: "Integrations",
            to: "/platform/integrations",
            comingSoon: true,
          },
          { label: "System", to: "/platform/system", comingSoon: true },
        ],
      },
    ],
  },
];

/** Every item across every section, flattened — used for route→section lookup. */
export function allNavItems(): { sectionId: string; item: NavItem }[] {
  return NAV_SECTIONS.flatMap((section) =>
    section.groups.flatMap((group) =>
      group.items.map((item) => ({ sectionId: section.id, item })),
    ),
  );
}

/**
 * Which rail section owns this path?
 *
 * Longest match wins: "/" would otherwise claim every route, and "/products"
 * would claim "/products/new" ambiguously. Returns null for routes outside the
 * nav (e.g. /login), leaving the rail unselected rather than guessing.
 */
export function sectionForPath(pathname: string): string | null {
  let bestId: string | null = null;
  let bestLength = -1;

  for (const { sectionId, item } of allNavItems()) {
    const matches =
      item.to === "/"
        ? pathname === "/"
        : pathname === item.to || pathname.startsWith(`${item.to}/`);

    if (matches && item.to.length > bestLength) {
      bestId = sectionId;
      bestLength = item.to.length;
    }
  }

  return bestId;
}
