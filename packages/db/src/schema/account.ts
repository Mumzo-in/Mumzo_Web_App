import { relations } from "drizzle-orm";
import {
  boolean,
  date,
  doublePrecision,
  index,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { user } from "./auth";
import { product } from "./catalog";

/**
 * Customer-owned account data that isn't catalog/order data. Starts with
 * `baby` (captured optionally during onboarding); other account-scoped
 * tables (addresses, etc.) can join this file later.
 *
 * One baby per user is captured during onboarding, but no unique constraint
 * on `userId` here — multi-baby management is a future feature and this
 * keeps the table ready for it without a later migration.
 */
export const baby = pgTable("baby", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  dob: date("dob").notNull(),
  // Kept a simple nullable text (not a pg enum) — mirrors the storefront's
  // mock `BabyGender = "girl" | "boy" | "other"` union loosely without
  // hard-coupling the DB to a UI-only type.
  gender: text("gender"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const babyRelations = relations(baby, ({ one }) => ({
  user: one(user, {
    fields: [baby.userId],
    references: [user.id],
  }),
}));

/**
 * Saved delivery addresses. `label` mirrors the storefront's
 * `AddressLabel = "Home" | "Work" | "Other"` union loosely as free text
 * rather than a pg enum, same rationale as `baby.gender` above. `lat`/`lng`
 * are nullable — only populated when the address was resolved via the
 * location picker's geocoding flow, not when hand-typed.
 */
export const address = pgTable(
  "address",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    label: text("label").notNull(),
    name: text("name").notNull(),
    phone: text("phone").notNull(),
    line1: text("line1").notNull(),
    line2: text("line2").notNull(),
    landmark: text("landmark"),
    pincode: text("pincode").notNull(),
    city: text("city").notNull(),
    lat: doublePrecision("lat"),
    lng: doublePrecision("lng"),
    isDefault: boolean("is_default").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("address_userId_idx").on(table.userId)],
);

export const addressRelations = relations(address, ({ one }) => ({
  user: one(user, {
    fields: [address.userId],
    references: [user.id],
  }),
}));

/**
 * Wishlisted products — a pure membership record (no per-row `id`; the
 * composite key is the natural identity, and "adding" the same product
 * twice is just a no-op upsert rather than a distinct row).
 */
export const wishlist = pgTable(
  "wishlist",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => product.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.productId] }),
    index("wishlist_userId_idx").on(table.userId),
  ],
);

export const wishlistRelations = relations(wishlist, ({ one }) => ({
  user: one(user, {
    fields: [wishlist.userId],
    references: [user.id],
  }),
  product: one(product, {
    fields: [wishlist.productId],
    references: [product.id],
  }),
}));
