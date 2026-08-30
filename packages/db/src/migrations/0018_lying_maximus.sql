CREATE TABLE "otp_attempt" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"phone_number" text NOT NULL,
	"ip_address" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "otp_attempt_phone_idx" ON "otp_attempt" USING btree ("phone_number","created_at");--> statement-breakpoint
CREATE INDEX "otp_attempt_ip_idx" ON "otp_attempt" USING btree ("ip_address","created_at");