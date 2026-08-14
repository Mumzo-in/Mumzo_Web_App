ALTER TABLE "coupon" ADD COLUMN "claimed_at" timestamp;--> statement-breakpoint
ALTER TABLE "referral_rules" ADD COLUMN "settle_on_delivery" boolean DEFAULT false NOT NULL;--> statement-breakpoint
-- Existing coupons predate the claim step — treat them as already claimed
-- (usable immediately) rather than retroactively locking them out.
UPDATE "coupon" SET "claimed_at" = "created_at" WHERE "claimed_at" IS NULL;