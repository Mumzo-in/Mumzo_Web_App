import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { user } from "./auth";
import { order } from "./commerce";
import { coupon } from "./marketing";

/**
 * Referral programme — see docs/platform/referral_system_architecture.md.
 * Rewards are coupons, not wallet credit: reaching a referral-count
 * milestone issues a single-use row in the existing `coupon` table
 * (marketing.ts), assigned to the referrer via `couponAssignment`. This
 * keeps redemption/expiry/`order.couponId` wiring in one place instead of
 * duplicating it here — `referral.couponId` is just a back-reference to
 * which coupon a given milestone produced.
 */

/** Reward-tier configuration — managed by SuperAdmin, read by the storefront. */
export const referralTier = pgTable(
  "referral_tier",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(), // "First invite"
    /** Successful referrals required to unlock this tier. Unique — one tier per threshold. */
    threshold: integer("threshold").notNull().unique(),
    /** Coupon face value in paise. */
    couponAmount: integer("coupon_amount").notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("referral_tier_threshold_idx").on(table.threshold)],
);

/** One row per user — their unique referral code and running successful count. */
export const userReferralCode = pgTable(
  "user_referral_code",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .unique()
      .references(() => user.id, { onDelete: "cascade" }),
    code: text("code").notNull().unique(), // "ANANYA150"
    successfulReferrals: integer("successful_referrals").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("user_referral_code_userId_idx").on(table.userId)],
);

/**
 * One row per invited friend — the 3-stage funnel through to settlement.
 * status: "link_shared" | "signed_up" | "order_placed" | "completed" |
 * "returned" | "cancelled".
 */
export const referral = pgTable(
  "referral",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    referrerUserId: text("referrer_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    /** Null until the friend signs up. */
    refereeUserId: text("referee_user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    codeUsed: text("code_used").notNull(),
    status: text("status").default("link_shared").notNull(),
    firstOrderId: uuid("first_order_id").references(() => order.id, {
      onDelete: "set null",
    }),
    deliveredAt: timestamp("delivered_at"),
    /** deliveredAt + RETURN_WINDOW_DAYS — when the cron job may settle this row. */
    returnWindowEnd: timestamp("return_window_end"),
    completedAt: timestamp("completed_at"),
    /**
     * The tier-milestone coupon this referral's completion triggered, if
     * any (most completions don't cross a new tier threshold and issue
     * nothing). Points into the shared `coupon` table, not a referral-only
     * one — see module docblock.
     */
    couponId: uuid("coupon_id").references(() => coupon.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("referral_referrerUserId_idx").on(table.referrerUserId),
    index("referral_refereeUserId_idx").on(table.refereeUserId),
    index("referral_status_idx").on(table.status),
    index("referral_returnWindowEnd_idx").on(table.returnWindowEnd),
  ],
);

// -------------------------------------------------------------------- relations

export const userReferralCodeRelations = relations(
  userReferralCode,
  ({ one }) => ({
    user: one(user, {
      fields: [userReferralCode.userId],
      references: [user.id],
    }),
  }),
);

export const referralRelations = relations(referral, ({ one }) => ({
  referrer: one(user, {
    fields: [referral.referrerUserId],
    references: [user.id],
    relationName: "referralReferrer",
  }),
  referee: one(user, {
    fields: [referral.refereeUserId],
    references: [user.id],
    relationName: "referralReferee",
  }),
  firstOrder: one(order, {
    fields: [referral.firstOrderId],
    references: [order.id],
  }),
  coupon: one(coupon, {
    fields: [referral.couponId],
    references: [coupon.id],
  }),
}));
