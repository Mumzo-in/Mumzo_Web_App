import { createAccessControl } from "better-auth/plugins/access";
import { adminAc, defaultStatements } from "better-auth/plugins/admin/access";

/**
 * The permission vocabulary and the base roles — the single source of truth.
 *
 * Two halves, deliberately split:
 *
 *   `statement`  what CAN be granted. Stays in code, because a permission is
 *                only real if a route checks it. Adding a resource here is a
 *                code change by definition.
 *   `ROLE_SEEDS` what each base role DOES get. Seeded into `staff_role`, then
 *                owned by the database — operators edit grants from the panel
 *                without a deploy.
 *
 * Everything else (the `ac.newRole()` objects below, the labels) is derived
 * from these two. Nothing is written twice.
 */

// ---------------------------------------------------------------- vocabulary

export const statement = {
  // `user` and `session` come from the admin plugin (ban, impersonate,
  // revoke). Spread rather than redefined so a plugin upgrade cannot silently
  // drop capabilities.
  ...defaultStatements,
  product: ["create", "read", "update", "delete"],
  category: ["create", "read", "update", "delete"],
  brand: ["create", "read", "update", "delete"],
  vendor: ["create", "read", "update", "delete"],
  inventory: ["read", "adjust"],
  hub: ["create", "read", "update", "delete"],
  serviceArea: ["create", "read", "update", "delete"],
  order: ["create", "read", "update", "cancel", "refund"],
  payment: ["read", "refund"],
  coupon: ["create", "read", "update", "delete"],
  referral: ["create", "read", "update", "delete"],
  review: ["read", "moderate"],
  ticket: ["read", "respond", "close"],
  fleet: ["read", "assign"],
  staff: ["create", "read", "update", "delete"],
  report: ["read", "export"],
  upload: ["create", "delete"],
  activityLog: ["read"],
} as const;

export const ac = createAccessControl(statement);

/** Display metadata for the roles matrix. Served by `GET /roles/permissions`. */
export const RESOURCE_LABELS: Record<string, string> = {
  user: "Customers",
  session: "Sessions",
  product: "Products",
  category: "Categories",
  brand: "Brands",
  vendor: "Vendors",
  inventory: "Inventory",
  hub: "Hubs",
  serviceArea: "Service areas",
  order: "Orders",
  payment: "Payments",
  coupon: "Coupons",
  referral: "Referrals",
  review: "Reviews",
  ticket: "Support tickets",
  fleet: "Fleet",
  staff: "Staff & roles",
  report: "Reports",
  upload: "Media uploads",
  activityLog: "Activity logs",
};

export const ACTION_LABELS: Record<string, string> = {
  create: "Create",
  read: "Read",
  update: "Update",
  delete: "Delete",
  list: "List",
  "set-role": "Set role",
  "set-password": "Set password",
  "set-email": "Set email",
  get: "Get",
  ban: "Ban",
  impersonate: "Impersonate",
  revoke: "Revoke",
  adjust: "Adjust",
  cancel: "Cancel",
  refund: "Refund",
  moderate: "Moderate",
  respond: "Respond",
  close: "Close",
  assign: "Assign",
  export: "Export",
};

// ---------------------------------------------------------------- base roles

export type RoleSeed = {
  key: string;
  label: string;
  description: string;
  permissions: Record<string, string[]>;
};

/** Every admin-plugin grant, as mutable arrays (its statements are readonly). */
const ADMIN_PLUGIN_GRANTS: Record<string, string[]> = Object.fromEntries(
  Object.entries(adminAc.statements).map(([resource, actions]) => [
    resource,
    [...actions],
  ]),
);

/**
 * Five base roles. Kept deliberately small — extra roles are created from the
 * panel, which is the point of the dynamic system. These are only the ones
 * needed to bootstrap and operate.
 *
 * Least-privilege by default: finance cannot edit the catalog, operations
 * cannot issue refunds. Widen from the panel as real workflows demand it.
 */
export const ROLE_SEEDS: RoleSeed[] = [
  {
    key: "superadmin",
    label: "Super Admin",
    description: "Unrestricted access, including staff and role management.",
    permissions: {
      ...ADMIN_PLUGIN_GRANTS,
      product: ["create", "read", "update", "delete"],
      category: ["create", "read", "update", "delete"],
      brand: ["create", "read", "update", "delete"],
      vendor: ["create", "read", "update", "delete"],
      inventory: ["read", "adjust"],
      hub: ["create", "read", "update", "delete"],
      serviceArea: ["create", "read", "update", "delete"],
      order: ["create", "read", "update", "cancel", "refund"],
      payment: ["read", "refund"],
      coupon: ["create", "read", "update", "delete"],
      referral: ["create", "read", "update", "delete"],
      review: ["read", "moderate"],
      ticket: ["read", "respond", "close"],
      fleet: ["read", "assign"],
      staff: ["create", "read", "update", "delete"],
      report: ["read", "export"],
      upload: ["create", "delete"],
      activityLog: ["read"],
    },
  },
  {
    key: "admin",
    label: "Admin",
    description: "Everything operational, but cannot manage staff or roles.",
    permissions: {
      ...ADMIN_PLUGIN_GRANTS,
      product: ["create", "read", "update", "delete"],
      category: ["create", "read", "update", "delete"],
      brand: ["create", "read", "update", "delete"],
      vendor: ["create", "read", "update", "delete"],
      inventory: ["read", "adjust"],
      hub: ["create", "read", "update", "delete"],
      serviceArea: ["create", "read", "update", "delete"],
      order: ["create", "read", "update", "cancel", "refund"],
      payment: ["read", "refund"],
      coupon: ["create", "read", "update", "delete"],
      referral: ["create", "read", "update", "delete"],
      review: ["read", "moderate"],
      ticket: ["read", "respond", "close"],
      fleet: ["read", "assign"],
      report: ["read", "export"],
      upload: ["create", "delete"],
      activityLog: ["read"],
    },
  },
  {
    key: "catalog",
    label: "Catalog",
    description: "Products, categories, and stock levels.",
    permissions: {
      product: ["create", "read", "update", "delete"],
      category: ["create", "read", "update", "delete"],
      brand: ["create", "read", "update", "delete"],
      vendor: ["create", "read", "update", "delete"],
      inventory: ["read", "adjust"],
      review: ["read", "moderate"],
      report: ["read"],
      upload: ["create", "delete"],
    },
  },
  {
    key: "operations",
    label: "Operations",
    description: "Dark-store stock, dispatch, and live orders.",
    permissions: {
      order: ["create", "read", "update", "cancel"],
      inventory: ["read", "adjust"],
      hub: ["read", "update"],
      serviceArea: ["read", "update"],
      fleet: ["read", "assign"],
      product: ["read"],
      vendor: ["read"],
      ticket: ["read", "respond", "close"],
      report: ["read"],
    },
  },
  {
    key: "support",
    label: "Support",
    description: "Customer queries, orders, refunds, and reviews.",
    permissions: {
      order: ["create", "read", "update", "cancel", "refund"],
      payment: ["read", "refund"],
      review: ["read", "moderate"],
      ticket: ["read", "respond", "close"],
      product: ["read"],
      // Can look up a customer, but not ban or impersonate one.
      user: ["list", "get"],
      report: ["read"],
    },
  },
];

export const ROLE_KEYS = ROLE_SEEDS.map((role) => role.key);

export type BaseRoleKey = (typeof ROLE_SEEDS)[number]["key"];

/**
 * `ac.newRole()` objects, derived from `ROLE_SEEDS` rather than written out
 * again.
 *
 * These exist for exactly one reason: the admin plugin validates `adminRoles`
 * against its `roles` config at startup and throws without it. Runtime
 * permission checks do **not** use these — they read `staff_role_permission`
 * via `apps/server/src/shared/permissions`.
 */
export const roles = Object.fromEntries(
  ROLE_SEEDS.map((seed) => [seed.key, ac.newRole(seed.permissions)]),
) as Record<string, ReturnType<typeof ac.newRole>>;
