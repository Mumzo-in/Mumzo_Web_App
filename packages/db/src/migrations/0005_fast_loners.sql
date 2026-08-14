CREATE TABLE "referral_rules" (
	"id" text PRIMARY KEY DEFAULT 'default' NOT NULL,
	"return_window_days" integer NOT NULL,
	"coupon_validity_days" integer NOT NULL,
	"monthly_cap_per_user" integer NOT NULL,
	"referee_reward_rupees" integer NOT NULL,
	"self_referral_block" boolean NOT NULL,
	"code_pattern" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
