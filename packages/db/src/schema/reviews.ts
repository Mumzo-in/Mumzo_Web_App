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

/**
 * Post-delivery review prompt — a lightweight overall-order rating (not the
 * deeper per-product review form at `/orders/$orderId/review`), shown as a
 * popup on delivery. Gates the referral nudge: rating >= 3 offers the
 * referral popup next; rating < 3 asks what went wrong instead. One row per
 * order, created the moment the order is delivered — `rating`/`comment`
 * stay null until the shopper actually responds.
 */
export const orderReview = pgTable(
  "order_review",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orderId: uuid("order_id")
      .notNull()
      .unique()
      .references(() => order.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    /** 1-5, null until the shopper rates. */
    rating: integer("rating"),
    /** Free-text feedback — "what could be better" for a 3+ rating, or
     * "what went wrong" for a <3 rating. Same column, different prompt. */
    comment: text("comment"),
    /** Whether the referral nudge popup was shown after this review
     * (rating >= 3 only) — distinct from `referralPromptSkipped` so we can
     * tell "never reached that step" apart from "saw it, dismissed it". */
    referralPromptShown: boolean("referral_prompt_shown")
      .default(false)
      .notNull(),
    /** User tapped "skip" on the referral nudge — never show it again for
     * this order (per-order, not a global opt-out). */
    referralPromptSkipped: boolean("referral_prompt_skipped")
      .default(false)
      .notNull(),
    /** Set once the delivery notification has been dispatched, so the sweep
     * job doesn't re-notify for the same order. */
    notifiedAt: timestamp("notified_at"),
    /** Set once the shopper submits a rating (or explicitly skips the
     * review itself) — null means still awaiting a response. */
    respondedAt: timestamp("responded_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("order_review_userId_idx").on(table.userId),
    index("order_review_notifiedAt_idx").on(table.notifiedAt),
  ],
);
