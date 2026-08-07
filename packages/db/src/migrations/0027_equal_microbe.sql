CREATE TABLE "customer_event" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "customer_event" ADD CONSTRAINT "customer_event_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "customer_event_userId_idx" ON "customer_event" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "customer_event_userId_createdAt_idx" ON "customer_event" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "customer_event_action_idx" ON "customer_event" USING btree ("action");