CREATE TABLE "notification_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"template_id" text NOT NULL,
	"channel" text NOT NULL,
	"status" text NOT NULL,
	"provider_message_id" text,
	"error" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_device" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"phone" text,
	"device_id" text NOT NULL,
	"channel" text NOT NULL,
	"platform" text NOT NULL,
	"token" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_seen_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_device_userId_deviceId_unique" UNIQUE("user_id","device_id")
);
--> statement-breakpoint
ALTER TABLE "notification_log" ADD CONSTRAINT "notification_log_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_device" ADD CONSTRAINT "user_device_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "notification_log_userId_idx" ON "notification_log" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "notification_log_templateId_idx" ON "notification_log" USING btree ("template_id");--> statement-breakpoint
CREATE INDEX "user_device_userId_idx" ON "user_device" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_device_deviceId_idx" ON "user_device" USING btree ("device_id");