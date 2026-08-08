CREATE TABLE "referral" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"referrer_user_id" text NOT NULL,
	"referee_user_id" text,
	"code_used" text NOT NULL,
	"status" text DEFAULT 'link_shared' NOT NULL,
	"first_order_id" uuid,
	"delivered_at" timestamp,
	"return_window_end" timestamp,
	"completed_at" timestamp,
	"coupon_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "referral_tier" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"threshold" integer NOT NULL,
	"coupon_amount" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "referral_tier_threshold_unique" UNIQUE("threshold")
);
--> statement-breakpoint
CREATE TABLE "user_referral_code" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"code" text NOT NULL,
	"successful_referrals" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_referral_code_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "user_referral_code_code_unique" UNIQUE("code")
);
--> statement-breakpoint
ALTER TABLE "referral" ADD CONSTRAINT "referral_referrer_user_id_user_id_fk" FOREIGN KEY ("referrer_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral" ADD CONSTRAINT "referral_referee_user_id_user_id_fk" FOREIGN KEY ("referee_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral" ADD CONSTRAINT "referral_first_order_id_order_id_fk" FOREIGN KEY ("first_order_id") REFERENCES "public"."order"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral" ADD CONSTRAINT "referral_coupon_id_coupon_id_fk" FOREIGN KEY ("coupon_id") REFERENCES "public"."coupon"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_referral_code" ADD CONSTRAINT "user_referral_code_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "referral_referrerUserId_idx" ON "referral" USING btree ("referrer_user_id");--> statement-breakpoint
CREATE INDEX "referral_refereeUserId_idx" ON "referral" USING btree ("referee_user_id");--> statement-breakpoint
CREATE INDEX "referral_status_idx" ON "referral" USING btree ("status");--> statement-breakpoint
CREATE INDEX "referral_returnWindowEnd_idx" ON "referral" USING btree ("return_window_end");--> statement-breakpoint
CREATE INDEX "referral_tier_threshold_idx" ON "referral_tier" USING btree ("threshold");--> statement-breakpoint
CREATE INDEX "user_referral_code_userId_idx" ON "user_referral_code" USING btree ("user_id");