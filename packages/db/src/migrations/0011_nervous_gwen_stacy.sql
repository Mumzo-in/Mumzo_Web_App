ALTER TABLE "referral_rules" ADD COLUMN "referee_min_order_rupees" integer DEFAULT 499 NOT NULL;--> statement-breakpoint
ALTER TABLE "referral_tier" ADD COLUMN "min_order_amount" integer DEFAULT 49900 NOT NULL;--> statement-breakpoint
ALTER TABLE "referral_tier" ADD COLUMN "split_count" integer DEFAULT 1 NOT NULL;