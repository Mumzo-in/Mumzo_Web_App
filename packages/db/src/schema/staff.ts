import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

/**
 * Staff auth — the admin panel. Email + password, with the admin plugin.
 *
 * Deliberately separate tables from `auth.ts` rather than one `user` table
 * with a `role` column. The isolation is then structural: a customer session
 * token cannot satisfy an admin route because the row it points at does not
 * exist in `staff_session`. With a shared table that guarantee depends on
 * every admin route remembering to check `role`, and one missed check is a
 * privilege escalation.
 *
 * The cost is that a person who is both a customer and an employee has two
 * accounts. That is the right trade here — staff and customers have different
 * lifecycles, different session lengths, and different risk profiles.
 *
 * Better Auth maps to these via `modelName` in `packages/auth/src/admin.ts`.
 */

export const staffUser = pgTable("staff_user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  // admin plugin fields.
  role: text("role"),
  banned: boolean("banned").default(false),
  banReason: text("ban_reason"),
  banExpires: timestamp("ban_expires"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const staffSession = pgTable(
  "staff_session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => staffUser.id, { onDelete: "cascade" }),
    // admin plugin: set when a staff member is impersonating a user.
    impersonatedBy: text("impersonated_by"),
  },
  (table) => [index("staff_session_userId_idx").on(table.userId)],
);

export const staffAccount = pgTable(
  "staff_account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => staffUser.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("staff_account_userId_idx").on(table.userId)],
);

/**
 * Separate from the customer `verification` table so a password-reset token
 * issued for a staff account cannot be replayed against a customer one.
 */
export const staffVerification = pgTable(
  "staff_verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("staff_verification_identifier_idx").on(table.identifier)],
);

export const staffUserRelations = relations(staffUser, ({ many }) => ({
  sessions: many(staffSession),
  accounts: many(staffAccount),
}));

export const staffSessionRelations = relations(staffSession, ({ one }) => ({
  user: one(staffUser, {
    fields: [staffSession.userId],
    references: [staffUser.id],
  }),
}));

export const staffAccountRelations = relations(staffAccount, ({ one }) => ({
  user: one(staffUser, {
    fields: [staffAccount.userId],
    references: [staffUser.id],
  }),
}));

/**
 * Role definitions, editable from the panel.
 *
 * Better Auth's `admin` plugin cannot do this itself — its `hasPermission` is
 * synchronous and reads an in-memory config object, and `dynamicAccessControl`
 * exists only in the `organization` plugin. So roles live here and are
 * resolved by our own middleware.
 *
 * What is *not* here: the resource/action vocabulary. That stays in
 * `packages/auth/src/permissions.ts`, because a permission is only meaningful
 * if code implements a check for it — a row naming a resource nothing guards
 * would be a lie.
 */
export const staffRole = pgTable("staff_role", {
  id: text("id").primaryKey(),
  /**
   * Matches the string stored in `staff_user.role`. No foreign key: Better
   * Auth owns that column and writes it directly. Immutable once seeded for
   * system roles — renaming would orphan every user holding it.
   */
  key: text("key").notNull().unique(),
  label: text("label").notNull(),
  description: text("description"),
  /** Seeded roles: cannot be deleted, key cannot change. */
  isSystem: boolean("is_system").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

/**
 * One row per granted (role, resource, action).
 *
 * A row per grant rather than a JSON blob on `staff_role`: it makes "who can
 * refund?" an ordinary query, and an audit diff a set of rows instead of a
 * text diff.
 */
export const staffRolePermission = pgTable(
  "staff_role_permission",
  {
    roleId: text("role_id")
      .notNull()
      .references(() => staffRole.id, { onDelete: "cascade" }),
    resource: text("resource").notNull(),
    action: text("action").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.roleId, table.resource, table.action] }),
    index("staff_role_permission_roleId_idx").on(table.roleId),
  ],
);

export const staffRoleRelations = relations(staffRole, ({ many }) => ({
  permissions: many(staffRolePermission),
}));

export const staffRolePermissionRelations = relations(
  staffRolePermission,
  ({ one }) => ({
    role: one(staffRole, {
      fields: [staffRolePermission.roleId],
      references: [staffRole.id],
    }),
  }),
);
