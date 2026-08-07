CREATE TABLE "staff_activity_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"staff_user_id" text NOT NULL,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text,
	"description" text NOT NULL,
	"previous_values" jsonb,
	"new_values" jsonb,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "staff_activity_log" ADD CONSTRAINT "staff_activity_log_staff_user_id_staff_user_id_fk" FOREIGN KEY ("staff_user_id") REFERENCES "public"."staff_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "staff_activity_log_staff_user_id_idx" ON "staff_activity_log" USING btree ("staff_user_id");--> statement-breakpoint
CREATE INDEX "staff_activity_log_entity_type_entity_id_idx" ON "staff_activity_log" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "staff_activity_log_created_at_idx" ON "staff_activity_log" USING btree ("created_at");