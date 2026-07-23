CREATE TABLE "bundle" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"price" integer NOT NULL,
	"images" text[] DEFAULT '{}' NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "bundle_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "bundle_item" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bundle_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "bundle_item_bundleId_productId_key" UNIQUE("bundle_id","product_id")
);
--> statement-breakpoint
ALTER TABLE "bundle_item" ADD CONSTRAINT "bundle_item_bundle_id_bundle_id_fk" FOREIGN KEY ("bundle_id") REFERENCES "public"."bundle"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bundle_item" ADD CONSTRAINT "bundle_item_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "bundle_status_idx" ON "bundle" USING btree ("status");--> statement-breakpoint
CREATE INDEX "bundle_item_bundleId_idx" ON "bundle_item" USING btree ("bundle_id");--> statement-breakpoint
CREATE INDEX "bundle_item_productId_idx" ON "bundle_item" USING btree ("product_id");