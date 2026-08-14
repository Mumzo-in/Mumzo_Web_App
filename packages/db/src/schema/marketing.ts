import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { user } from "./auth";
import { brand, category, product } from "./catalog";

/**
 * Discount codes. Fields go beyond the original flat api-plan list —
 * targeting/visibility/stacking were added for full configurability.
 * `usedCount` is a running counter, not derived from order history (no
 * `order` table exists yet) — see the coupons service for what that means
 * for enforcement.
 */
export const coupon = pgTable(
  "coupon",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    code: text("code").notNull().unique(),
    description: text("description"),

    /** CouponType: "flat" | "pct". */
    type: text("type").notNull(),
    /** Paise off when `flat`; percent (1-100, not paise) when `pct`. */
    value: integer("value").notNull(),
    /** Max discount amount (paise) for a `pct` coupon; null = uncapped. Ignored for `flat`. */
    cap: integer("cap"),
    /** Paise. */
    minAmt: integer("min_amt").default(0).notNull(),

    /** Every scope column is nullable — null means unrestricted on that axis. */
    categorySlug: text("category_slug").references(() => category.slug, {
      onDelete: "set null",
    }),
    brandId: uuid("brand_id").references(() => brand.id, {
      onDelete: "set null",
    }),
    /** ProductScope: "all" | "specific" — "specific" consults `couponProduct`. */
    productScope: text("product_scope").default("all").notNull(),

    /** Visibility: "public" | "assigned" — "assigned" consults `couponAssignment`. */
    visibility: text("visibility").default("public").notNull(),

    /** Free-text segment tag (e.g. "first_time", "vip") — no segment entity exists yet. */
    segment: text("segment"),

    firstOrderOnly: boolean("first_order_only").default(false).notNull(),

    /** Global cap; null = uncapped. */
    maxUses: integer("max_uses"),
    /** Not enforced yet — needs order history to count a user's redemptions. */
    maxUsesPerUser: integer("max_uses_per_user"),
    usedCount: integer("used_count").default(0).notNull(),

    isStackable: boolean("is_stackable").default(false).notNull(),
    /** Higher wins when multiple non-stackable coupons could apply. */
    priority: integer("priority").default(0).notNull(),

    expiresAt: timestamp("expires_at").notNull(),
    /** Null = active immediately. */
    startsAt: timestamp("starts_at"),
    isActive: boolean("is_active").default(true).notNull(),
    isGlobal: boolean("is_global").default(false).notNull(),
    /**
     * Null = issued but not yet claimed — unusable at checkout until the
     * owner claims it (referral tier coupons issued at delivery, before
     * the return window has passed). `expiresAt` is a placeholder far-future
     * date while unclaimed; claiming sets this to now and recomputes
     * `expiresAt` as `now + couponValidityDays`, so the validity window
     * starts when the reward is actually claimed, not when it was minted.
     * Coupons that don't go through a claim step (everything issued today)
     * are created with this already set to `createdAt`.
     */
    claimedAt: timestamp("claimed_at"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("coupon_categorySlug_idx").on(table.categorySlug),
    index("coupon_brandId_idx").on(table.brandId),
    index("coupon_isActive_idx").on(table.isActive),
  ],
);

/** Product-level scoping when `coupon.productScope === "specific"`. */
export const couponProduct = pgTable(
  "coupon_product",
  {
    couponId: uuid("coupon_id")
      .notNull()
      .references(() => coupon.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => product.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.couponId, table.productId] }),
    index("coupon_product_productId_idx").on(table.productId),
  ],
);

/** Assignment when `coupon.visibility === "assigned"` — who can see/use it. */
export const couponAssignment = pgTable(
  "coupon_assignment",
  {
    couponId: uuid("coupon_id")
      .notNull()
      .references(() => coupon.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.couponId, table.userId] }),
    index("coupon_assignment_userId_idx").on(table.userId),
  ],
);

// -------------------------------------------------------------------- relations

export const couponRelations = relations(coupon, ({ one, many }) => ({
  category: one(category, {
    fields: [coupon.categorySlug],
    references: [category.slug],
  }),
  brand: one(brand, { fields: [coupon.brandId], references: [brand.id] }),
  products: many(couponProduct),
  assignments: many(couponAssignment),
}));

export const couponProductRelations = relations(couponProduct, ({ one }) => ({
  coupon: one(coupon, {
    fields: [couponProduct.couponId],
    references: [coupon.id],
  }),
  product: one(product, {
    fields: [couponProduct.productId],
    references: [product.id],
  }),
}));

export const couponAssignmentRelations = relations(
  couponAssignment,
  ({ one }) => ({
    coupon: one(coupon, {
      fields: [couponAssignment.couponId],
      references: [coupon.id],
    }),
    user: one(user, {
      fields: [couponAssignment.userId],
      references: [user.id],
    }),
  }),
);
