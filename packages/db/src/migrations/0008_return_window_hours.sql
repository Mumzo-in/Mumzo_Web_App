ALTER TABLE "referral_rules" RENAME COLUMN "return_window_days" TO "return_window_hours";--> statement-breakpoint
-- Return window now tracks hours, not days — reset the existing singleton
-- row to the new 1-hour policy rather than reinterpreting the old day count.
UPDATE "referral_rules" SET "return_window_hours" = 1;
