CREATE TABLE "vendor" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"type" text DEFAULT 'distributor' NOT NULL,
	"contact_name" text,
	"phone" text,
	"email" text,
	"address" text,
	"gstin" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "vendor_name_unique" UNIQUE("name"),
	CONSTRAINT "vendor_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN "vendor_id" uuid;--> statement-breakpoint
ALTER TABLE "product" ADD CONSTRAINT "product_vendor_id_vendor_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendor"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "product_vendorId_idx" ON "product" USING btree ("vendor_id");