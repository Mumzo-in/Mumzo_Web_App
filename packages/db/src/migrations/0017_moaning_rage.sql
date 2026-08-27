ALTER TABLE "notification_log" ADD COLUMN "app" text DEFAULT 'platform' NOT NULL;--> statement-breakpoint
ALTER TABLE "notification_log" ADD COLUMN "error_code" text;--> statement-breakpoint
ALTER TABLE "notification_log" ADD COLUMN "device_id" uuid;--> statement-breakpoint
ALTER TABLE "notification_log" ADD COLUMN "delivered_at" timestamp;--> statement-breakpoint
ALTER TABLE "staff_device" ADD COLUMN "app" text DEFAULT 'admin' NOT NULL;--> statement-breakpoint
ALTER TABLE "user_device" ADD COLUMN "app" text DEFAULT 'platform' NOT NULL;--> statement-breakpoint
CREATE INDEX "notification_log_providerMessageId_idx" ON "notification_log" USING btree ("provider_message_id");--> statement-breakpoint
CREATE INDEX "notification_log_status_idx" ON "notification_log" USING btree ("status","created_at");