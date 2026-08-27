CREATE TABLE "notification_job" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"template_id" text NOT NULL,
	"payload" jsonb NOT NULL,
	"audience" text DEFAULT 'customer' NOT NULL,
	"user_id" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"max_attempts" integer DEFAULT 5 NOT NULL,
	"run_after" timestamp DEFAULT now() NOT NULL,
	"priority" integer DEFAULT 100 NOT NULL,
	"last_error" text,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "notification_job_claim_idx" ON "notification_job" USING btree ("priority","run_after") WHERE "notification_job"."status" = 'pending';--> statement-breakpoint
CREATE INDEX "notification_job_status_idx" ON "notification_job" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "notification_job_templateId_idx" ON "notification_job" USING btree ("template_id");--> statement-breakpoint
-- Doorbell for the notification worker. Hand-written: drizzle-kit has no
-- schema-level representation for triggers, so this block is preserved by
-- hand across regenerations.
--
-- Fires only for rows that are immediately runnable. A retry scheduled into
-- the future has nothing to wake anyone for — the worker's poll picks it up
-- when it comes due, and notifying here would just cause a wasted wakeup.
CREATE OR REPLACE FUNCTION notify_notification_job() RETURNS trigger AS $$
BEGIN
  IF NEW.status = 'pending' AND NEW.run_after <= now() THEN
    PERFORM pg_notify('notification_job', NEW.id::text);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint
CREATE TRIGGER notification_job_notify
AFTER INSERT ON notification_job
FOR EACH ROW EXECUTE FUNCTION notify_notification_job();
