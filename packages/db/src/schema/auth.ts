import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

/**
 * Customer auth — the storefront. Phone + OTP.
 *
 * Staff live in `staff.ts` on their own tables, so a customer session can
 * never satisfy an admin route. See that file for the reasoning.
 */
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  // phoneNumber plugin. Nullable because Better Auth creates the row before
  // the number is attached, and unique because it is the login identifier.
  phoneNumber: text("phone_number").unique(),
  phoneNumberVerified: boolean("phone_number_verified").default(false),
  // Set the moment the customer completes (or explicitly skips the optional
  // parts of) the post-signup "complete your profile" flow. Null means the
  // account still carries `getTempName`'s phone-number placeholder as its
  // name and has never been through onboarding. Explicit column rather than
  // inferring from `name === phoneNumber` so a later legitimate name change
  // can never be mistaken for "still needs onboarding".
  onboardedAt: timestamp("onboarded_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const session = pgTable(
  "session",
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
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [index("session_userId_idx").on(table.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
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
  (table) => [index("account_userId_idx").on(table.userId)],
);

export const verification = pgTable(
  "verification",
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
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

/**
 * OTP send attempts, for rate limiting.
 *
 * Postgres rather than Redis on purpose: this is the only feature that
 * would have needed Redis, and one table plus an index is far cheaper than
 * a managed instance for a handful of writes per minute. The same
 * reasoning that moved the notification queue off BullMQ applies here.
 *
 * Rows are transient — a retention sweep discards anything older than the
 * longest window, so the table stays small enough for the index to live in
 * memory.
 */
export const otpAttempt = pgTable(
  "otp_attempt",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    /** Normalised phone number the code was requested for. */
    phoneNumber: text("phone_number").notNull(),
    /** Requester IP, so one host can't cycle through many numbers. */
    ipAddress: text("ip_address"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    /** The rate-limit query: "attempts for this number since T". */
    index("otp_attempt_phone_idx").on(table.phoneNumber, table.createdAt),
    /** The per-IP variant of the same question. */
    index("otp_attempt_ip_idx").on(table.ipAddress, table.createdAt),
  ],
);
