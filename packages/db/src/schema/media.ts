import { boolean, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { staffUser } from "./staff";

/**
 * Tracks a draft image-upload session while a form is open. Images land in
 * `mumzo/tmp/{sessionId}/{slot}.webp`; finalized when the owning form
 * submits (copied to their final key, session marked `finalized`).
 *
 * Abandoned sessions are cleaned up by a 24h R2 lifecycle rule on the `tmp/`
 * prefix, independent of this row's lifetime.
 */
export const uploadSessions = pgTable("upload_sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => staffUser.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  finalized: boolean("finalized").default(false).notNull(),
});
