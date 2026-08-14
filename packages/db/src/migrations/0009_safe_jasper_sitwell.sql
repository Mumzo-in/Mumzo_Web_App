CREATE TABLE "order_review" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"rating" integer,
	"comment" text,
	"referral_prompt_shown" boolean DEFAULT false NOT NULL,
	"referral_prompt_skipped" boolean DEFAULT false NOT NULL,
	"notified_at" timestamp,
	"responded_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "order_review_order_id_unique" UNIQUE("order_id")
);
--> statement-breakpoint
ALTER TABLE "order_review" ADD CONSTRAINT "order_review_order_id_order_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."order"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_review" ADD CONSTRAINT "order_review_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "order_review_userId_idx" ON "order_review" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "order_review_notifiedAt_idx" ON "order_review" USING btree ("notified_at");