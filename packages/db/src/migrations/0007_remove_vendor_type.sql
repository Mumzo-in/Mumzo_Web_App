CREATE TABLE "product_vendor" (
	"product_id" uuid PRIMARY KEY NOT NULL,
	"vendor_id" uuid NOT NULL,
	"relationship" text DEFAULT 'distributor' NOT NULL,
	"cost_price" integer,
	"lead_time_days" integer,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "product" DROP CONSTRAINT "product_vendor_id_vendor_id_fk";
--> statement-breakpoint
DROP INDEX "product_vendorId_idx";--> statement-breakpoint
ALTER TABLE "product_vendor" ADD CONSTRAINT "product_vendor_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_vendor" ADD CONSTRAINT "product_vendor_vendor_id_vendor_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendor"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "product_vendor_vendorId_idx" ON "product_vendor" USING btree ("vendor_id");--> statement-breakpoint
-- Backfill: move each product's existing vendor_id/cost_price into
-- product_vendor BEFORE those columns are dropped below. Only products that
-- actually had a vendor on file get a row — self-stocked products (vendor_id
-- null) get none, matching the new "no row = self-stocked" convention.
-- relationship/lead_time_days/notes have no prior data to carry over, so they
-- take the column default / NULL.
INSERT INTO "product_vendor" ("product_id", "vendor_id", "cost_price")
SELECT "id", "vendor_id", "cost_price"
FROM "product"
WHERE "vendor_id" IS NOT NULL;
--> statement-breakpoint
ALTER TABLE "product" DROP COLUMN "vendor_id";--> statement-breakpoint
ALTER TABLE "product" DROP COLUMN "cost_price";--> statement-breakpoint
ALTER TABLE "vendor" DROP COLUMN "type";