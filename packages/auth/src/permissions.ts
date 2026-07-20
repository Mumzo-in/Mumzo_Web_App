import { createAccessControl } from "better-auth/plugins/access";
import { adminAc, defaultStatements } from "better-auth/plugins/admin/access";

/**
 * Staff permission matrix.
 *
 * Resources and the actions each supports. `defaultStatements` carries the
 * admin plugin's own `user` and `session` resources (ban, impersonate, list,
 * revoke) — spread rather than redefined so plugin upgrades do not silently
 * drop capabilities.
 */
export const statement = {
  ...defaultStatements,
  product: ["create", "read", "update", "delete"],
  category: ["create", "read", "update", "delete"],
  inventory: ["read", "adjust"],
  order: ["read", "update", "cancel", "refund"],
  payment: ["read", "refund"],
  coupon: ["create", "read", "update", "delete"],
  review: ["read", "moderate"],
  ticket: ["read", "respond", "close"],
  fleet: ["read", "assign"],
  staff: ["create", "read", "update", "delete"],
  report: ["read", "export"],
} as const;

export const ac = createAccessControl(statement);

/**
 * Six roles, matching `docs/superadmin/features.md` §1.
 *
 * The grants below are a starting point, deliberately least-privilege:
 * finance cannot edit the catalog, catalog managers cannot issue refunds.
 * Widen as real workflows demand it rather than granting broadly up front.
 */

export const superadmin = ac.newRole({
  ...adminAc.statements,
  product: ["create", "read", "update", "delete"],
  category: ["create", "read", "update", "delete"],
  inventory: ["read", "adjust"],
  order: ["read", "update", "cancel", "refund"],
  payment: ["read", "refund"],
  coupon: ["create", "read", "update", "delete"],
  review: ["read", "moderate"],
  ticket: ["read", "respond", "close"],
  fleet: ["read", "assign"],
  staff: ["create", "read", "update", "delete"],
  report: ["read", "export"],
});

/** Everything operational, but cannot manage staff accounts. */
export const admin = ac.newRole({
  ...adminAc.statements,
  product: ["create", "read", "update", "delete"],
  category: ["create", "read", "update", "delete"],
  inventory: ["read", "adjust"],
  order: ["read", "update", "cancel", "refund"],
  payment: ["read", "refund"],
  coupon: ["create", "read", "update", "delete"],
  review: ["read", "moderate"],
  ticket: ["read", "respond", "close"],
  fleet: ["read", "assign"],
  report: ["read", "export"],
});

export const catalog_manager = ac.newRole({
  product: ["create", "read", "update", "delete"],
  category: ["create", "read", "update", "delete"],
  inventory: ["read", "adjust"],
  review: ["read", "moderate"],
  report: ["read"],
});

export const support = ac.newRole({
  order: ["read", "update", "cancel"],
  payment: ["read"],
  review: ["read", "moderate"],
  ticket: ["read", "respond", "close"],
  product: ["read"],
  // Can look up a customer, but not ban or impersonate one.
  user: ["list"],
});

export const finance = ac.newRole({
  payment: ["read", "refund"],
  order: ["read", "refund"],
  coupon: ["create", "read", "update", "delete"],
  report: ["read", "export"],
});

/** Dark-store and fleet operations. */
export const ops = ac.newRole({
  order: ["read", "update", "cancel"],
  inventory: ["read", "adjust"],
  fleet: ["read", "assign"],
  product: ["read"],
  report: ["read"],
});

export const roles = {
  superadmin,
  admin,
  catalog_manager,
  support,
  finance,
  ops,
} as const;
