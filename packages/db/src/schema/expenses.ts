import { relations } from "drizzle-orm";
import {
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { hub } from "./catalog";
import { rider } from "./delivery";
import { staffUser } from "./staff";

/**
 * Business expense ledger — rent, utilities, salaries, marketing spend, rider
 * payouts, and other operational costs. Distinct from `vendor` invoices
 * (goods bought for resale) and `refund` (money returned to a customer).
 *
 * `hubId`/`riderId` are both nullable and independent, not mutually
 * exclusive with each other — a hub-scoped expense (rent) sets `hubId`
 * only, a rider payout (fuel reimbursement) sets `riderId` only, and a
 * company-wide expense (head-office software subscription) sets neither.
 */
export const expense = pgTable(
  "expense",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    /** ExpenseCategory: rent | utilities | salaries | marketing | hub_ops |
     * delivery_fuel | equipment | maintenance | software | other. */
    category: text("category").notNull(),
    /** Paise, matching the money convention used across `commerce.ts`. */
    amount: integer("amount").notNull(),
    hubId: uuid("hub_id").references(() => hub.id, { onDelete: "set null" }),
    riderId: uuid("rider_id").references(() => rider.id, {
      onDelete: "set null",
    }),
    title: text("title").notNull(),
    note: text("note"),
    receiptUrl: text("receipt_url"),
    /** When the cost was actually incurred — may predate `createdAt` for a
     * backfilled/late-logged expense. */
    spentAt: timestamp("spent_at").defaultNow().notNull(),
    createdById: text("created_by_id")
      .notNull()
      .references(() => staffUser.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("expense_category_idx").on(table.category),
    index("expense_hubId_idx").on(table.hubId),
    index("expense_riderId_idx").on(table.riderId),
    index("expense_spentAt_idx").on(table.spentAt),
  ],
);

export const expenseRelations = relations(expense, ({ one }) => ({
  hub: one(hub, { fields: [expense.hubId], references: [hub.id] }),
  rider: one(rider, { fields: [expense.riderId], references: [rider.id] }),
  createdBy: one(staffUser, {
    fields: [expense.createdById],
    references: [staffUser.id],
  }),
}));
