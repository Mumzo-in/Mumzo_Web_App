CREATE TABLE "delivery_link" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"token" text NOT NULL,
	"rider_id" uuid,
	"unlocked_at" timestamp,
	"outcome" text,
	"outcome_reason" text,
	"outcome_at" timestamp,
	"failed_attempts" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "delivery_link_token_unique" UNIQUE("token")
);
--> statement-breakpoint
ALTER TABLE "rider" ADD COLUMN "access_code" text;--> statement-breakpoint
ALTER TABLE "delivery_link" ADD CONSTRAINT "delivery_link_order_id_order_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."order"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delivery_link" ADD CONSTRAINT "delivery_link_rider_id_rider_id_fk" FOREIGN KEY ("rider_id") REFERENCES "public"."rider"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "delivery_link_order_id_idx" ON "delivery_link" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "delivery_link_token_idx" ON "delivery_link" USING btree ("token");--> statement-breakpoint
CREATE UNIQUE INDEX "delivery_link_open_order_idx" ON "delivery_link" USING btree ("order_id") WHERE "delivery_link"."outcome" is null;--> statement-breakpoint
ALTER TABLE "rider" ADD CONSTRAINT "rider_access_code_unique" UNIQUE("access_code");