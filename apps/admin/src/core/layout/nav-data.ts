import {
  LayoutDashboard,
  type LucideIcon,
  Megaphone,
  Receipt,
  Settings,
  Smartphone,
  Store,
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
        label: "Control Room",
        items: [
          { label: "Dashboard", to: "/" },
          { label: "Live Ops Board", to: "/overview/ops" },
          { label: "Analytics", to: "/overview/analytics" },
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
        label: "Fulfillment",
        items: [{ label: "Orders", to: "/operations/orders" }],
      },
      {
        label: "Catalog",
        items: [
          { label: "Products", to: "/catalog/products" },
          { label: "Categories", to: "/catalog/categories" },
          { label: "Brands", to: "/catalog/brands" },
          { label: "Vendors", to: "/catalog/vendors" },
        ],
      },
      {
        label: "Dark Store",
        items: [
          { label: "Hubs", to: "/catalog/hubs" },
          {
            label: "Service Areas",
            to: "/operations/service-areas",
            comingSoon: true,
          },
        ],
      },
    ],
  },
  {
    id: "platform",
    label: "Platform",
    icon: Smartphone,
    to: "/platform/users/analytics",
    groups: [
      {
        label: "Users",
        items: [
          { label: "Analytics", to: "/platform/users/analytics" },
          { label: "Users", to: "/platform/users/list" },
        ],
      },
      {
        label: "System",
        items: [
          { label: "Feature Flags", to: "/platform/flags", comingSoon: true },
        ],
      },
    ],
  },
  {
    id: "marketing",
    label: "Marketing",
    icon: Megaphone,
    to: "/finance/coupons",
    groups: [
      {
        label: "Promotions",
        items: [
          { label: "Coupons & Offers", to: "/finance/coupons" },
          { label: "Banners CMS", to: "/legal/banners", comingSoon: true },
        ],
      },
    ],
  },
  {
    id: "expenses",
    label: "Expenses",
    icon: Receipt,
    to: "/expenses",
    groups: [
      {
        label: "Ledger",
        items: [
          { label: "All Expenses", to: "/expenses", comingSoon: true },
          {
            label: "Claims & Payouts",
            to: "/expenses/payouts",
            comingSoon: true,
          },
        ],
      },
    ],
  },
  {
    id: "settings",
    label: "Settings",
    icon: Settings,
    to: "/settings/profile",
    groups: [
      {
        label: "Administration",
        items: [
          { label: "My Profile", to: "/settings/profile" },
          { label: "Staff Members", to: "/staff" },
          { label: "Roles & Permissions", to: "/roles" },
          { label: "Static Pages", to: "/legal/pages" },
          { label: "Activity Logs", to: "/settings/activity-logs" },
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
