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

/**
 * Programme-wide rules — a single-row table, managed by SuperAdmin, read by
 * the settlement engine and the storefront. `id` is always the fixed
 * singleton value `"default"` — the repo upserts against that constant
 * rather than tracking a real primary key, since there is exactly one
 * configuration for the whole programme (no per-tenant/per-region rules).
 */
export const referralRules = pgTable("referral_rules", {
  id: text("id").primaryKey().default("default"),
  /** Hours a friend's order stays returnable before a referral can settle. */
  returnWindowHours: integer("return_window_hours").notNull(),
  /** Days an issued coupon (tier or referee) stays redeemable. */
  couponValidityDays: integer("coupon_validity_days").notNull(),
  /** Max tier coupons a single referrer can earn per calendar month. 0 = no cap. */
  monthlyCapPerUser: integer("monthly_cap_per_user").notNull(),
  /** Rupees off the referee's first order when they sign up with a code. */
  refereeRewardRupees: integer("referee_reward_rupees").notNull(),
  /** Block referrer/referee sharing phone, email, or device fingerprint. */
  selfReferralBlock: boolean("self_referral_block").notNull(),
  /** Documents how `userReferralCode.code` is generated — display-only, the
   * generator itself is code, not driven by this string. */
  codePattern: text("code_pattern").notNull(),
  /** When true, a referral settles (tier count increments, coupon issued)
   * as soon as the referred order is delivered instead of waiting for the
   * return window to pass — trades the return-window fraud protection for
   * a faster reward. Coupons issued this way still require the referrer to
   * claim them before the validity clock starts (see `coupon.claimedAt`). */
  settleOnDelivery: boolean("settle_on_delivery").default(false).notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

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
    /**
     * The referee's one-time first-order welcome coupon, issued at signup
     * (`applyCodeOnSignup`) — separate from `couponId` above, which is the
     * *referrer's* tier-milestone coupon issued much later at settlement.
     * Also doubles as the discriminator `validateCoupon` uses to tell a
     * referral-issued coupon apart from an ordinary assigned marketing
     * coupon when rejecting a not-mine "assigned" apply attempt.
     */
    refereeCouponId: uuid("referee_coupon_id").references(() => coupon.id, {
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
    index("referral_couponId_idx").on(table.couponId),
    index("referral_refereeCouponId_idx").on(table.refereeCouponId),
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
    relationName: "referralTierCoupon",
  }),
  refereeCoupon: one(coupon, {
    fields: [referral.refereeCouponId],
    references: [coupon.id],
    relationName: "referralRefereeCoupon",
  }),
}));
