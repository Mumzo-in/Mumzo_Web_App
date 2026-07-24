import { relations } from "drizzle-orm";
import { date, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "./auth";

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
