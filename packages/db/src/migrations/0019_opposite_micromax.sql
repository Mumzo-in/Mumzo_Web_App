CREATE TABLE "staff_device" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"staff_user_id" text NOT NULL,
	"device_id" text NOT NULL,
	"channel" text NOT NULL,
	"platform" text NOT NULL,
	"token" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_seen_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "staff_device_staffUserId_deviceId_unique" UNIQUE("staff_user_id","device_id")
);
--> statement-breakpoint
ALTER TABLE "notification_log" ALTER COLUMN "user_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "notification_log" ADD COLUMN "staff_user_id" text;--> statement-breakpoint
ALTER TABLE "staff_device" ADD CONSTRAINT "staff_device_staff_user_id_staff_user_id_fk" FOREIGN KEY ("staff_user_id") REFERENCES "public"."staff_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "staff_device_staffUserId_idx" ON "staff_device" USING btree ("staff_user_id");--> statement-breakpoint
CREATE INDEX "staff_device_deviceId_idx" ON "staff_device" USING btree ("device_id");--> statement-breakpoint
ALTER TABLE "notification_log" ADD CONSTRAINT "notification_log_staff_user_id_staff_user_id_fk" FOREIGN KEY ("staff_user_id") REFERENCES "public"."staff_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "notification_log_staffUserId_idx" ON "notification_log" USING btree ("staff_user_id");