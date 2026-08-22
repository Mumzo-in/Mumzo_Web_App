CREATE TABLE "expense" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category" text NOT NULL,
	"amount" integer NOT NULL,
	"hub_id" uuid,
	"rider_id" uuid,
	"title" text NOT NULL,
	"note" text,
	"receipt_url" text,
	"spent_at" timestamp DEFAULT now() NOT NULL,
	"created_by_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "expense" ADD CONSTRAINT "expense_hub_id_hub_id_fk" FOREIGN KEY ("hub_id") REFERENCES "public"."hub"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense" ADD CONSTRAINT "expense_rider_id_rider_id_fk" FOREIGN KEY ("rider_id") REFERENCES "public"."rider"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense" ADD CONSTRAINT "expense_created_by_id_staff_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."staff_user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "expense_category_idx" ON "expense" USING btree ("category");--> statement-breakpoint
CREATE INDEX "expense_hubId_idx" ON "expense" USING btree ("hub_id");--> statement-breakpoint
CREATE INDEX "expense_riderId_idx" ON "expense" USING btree ("rider_id");--> statement-breakpoint
CREATE INDEX "expense_spentAt_idx" ON "expense" USING btree ("spent_at");