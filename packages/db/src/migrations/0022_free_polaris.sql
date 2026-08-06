CREATE TABLE "stock_movement" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"hub_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"product_size_id" uuid,
	"product_color_id" uuid,
	"type" text NOT NULL,
	"quantity" integer NOT NULL,
	"stock_after" integer NOT NULL,
	"reference_type" text,
	"reference_id" uuid,
	"unit_cost_paise" integer,
	"reason" text,
	"actor" text NOT NULL,
	"batch_number" text,
	"expiry_date" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "delivery_assignment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"rider_id" uuid NOT NULL,
	"hub_id" uuid NOT NULL,
	"status" text DEFAULT 'assigned' NOT NULL,
	"distance_meters" integer,
	"estimated_duration_secs" integer,
	"actual_duration_secs" integer,
	"delivery_lat" double precision,
	"delivery_lng" double precision,
	"pod_type" text,
	"pod_value" text,
	"pod_verified_at" timestamp,
	"provider" text DEFAULT 'own' NOT NULL,
	"external_tracking_id" text,
	"external_tracking_url" text,
	"assigned_at" timestamp DEFAULT now() NOT NULL,
	"picked_up_at" timestamp,
	"delivered_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rider" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"phone" text NOT NULL,
	"email" text,
	"hub_id" uuid,
	"status" text DEFAULT 'inactive' NOT NULL,
	"vehicle_type" text,
	"vehicle_number" text,
	"license_number" text,
	"kyc_verified" boolean DEFAULT false NOT NULL,
	"photo_url" text,
	"current_lat" double precision,
	"current_lng" double precision,
	"last_location_at" timestamp,
	"rating" numeric(2, 1) DEFAULT '5.0' NOT NULL,
	"total_deliveries" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "rider_phone_unique" UNIQUE("phone")
);
--> statement-breakpoint
CREATE TABLE "goods_received_note" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"grn_number" text NOT NULL,
	"purchase_order_id" uuid NOT NULL,
	"hub_id" uuid NOT NULL,
	"received_by" text NOT NULL,
	"notes" text,
	"received_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "goods_received_note_grn_number_unique" UNIQUE("grn_number")
);
--> statement-breakpoint
CREATE TABLE "goods_received_note_item" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"grn_id" uuid NOT NULL,
	"purchase_order_item_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"accepted_qty" integer NOT NULL,
	"rejected_qty" integer DEFAULT 0 NOT NULL,
	"rejection_reason" text,
	"batch_number" text,
	"expiry_date" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "purchase_order" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"po_number" text NOT NULL,
	"vendor_id" uuid NOT NULL,
	"hub_id" uuid NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"expected_date" timestamp,
	"total_paise" integer DEFAULT 0 NOT NULL,
	"notes" text,
	"created_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "purchase_order_po_number_unique" UNIQUE("po_number")
);
--> statement-breakpoint
CREATE TABLE "purchase_order_item" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"purchase_order_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"product_size_id" uuid,
	"product_color_id" uuid,
	"ordered_qty" integer NOT NULL,
	"received_qty" integer DEFAULT 0 NOT NULL,
	"unit_cost_paise" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stock_transfer" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"transfer_number" text NOT NULL,
	"from_hub_id" uuid NOT NULL,
	"to_hub_id" uuid NOT NULL,
	"status" text DEFAULT 'requested' NOT NULL,
	"requested_by" text NOT NULL,
	"approved_by" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "stock_transfer_transfer_number_unique" UNIQUE("transfer_number")
);
--> statement-breakpoint
CREATE TABLE "stock_transfer_item" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"transfer_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"product_size_id" uuid,
	"product_color_id" uuid,
	"quantity" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
/* 
    Unfortunately in current drizzle-kit version we can't automatically get name for primary key.
    We are working on making it available!

    Meanwhile you can:
        1. Check pk name in your database, by running
            SELECT constraint_name FROM information_schema.table_constraints
            WHERE table_schema = 'public'
                AND table_name = 'product_vendor'
                AND constraint_type = 'PRIMARY KEY';
        2. Uncomment code below and paste pk name manually
        
    Hope to release this update as soon as possible
*/

ALTER TABLE "product_vendor" DROP CONSTRAINT "product_vendor_pkey";--> statement-breakpoint
ALTER TABLE "hub" ADD COLUMN "type" text DEFAULT 'dark_store' NOT NULL;--> statement-breakpoint
ALTER TABLE "hub" ADD COLUMN "city" text;--> statement-breakpoint
ALTER TABLE "hub" ADD COLUMN "state" text;--> statement-breakpoint
ALTER TABLE "hub" ADD COLUMN "pincode" text;--> statement-breakpoint
ALTER TABLE "hub" ADD COLUMN "contact_name" text;--> statement-breakpoint
ALTER TABLE "hub" ADD COLUMN "contact_phone" text;--> statement-breakpoint
ALTER TABLE "hub" ADD COLUMN "capacity" integer;--> statement-breakpoint
ALTER TABLE "hub" ADD COLUMN "operating_hours_start" text;--> statement-breakpoint
ALTER TABLE "hub" ADD COLUMN "operating_hours_end" text;--> statement-breakpoint
ALTER TABLE "hub" ADD COLUMN "avg_pick_pack_mins" integer DEFAULT 3 NOT NULL;--> statement-breakpoint
ALTER TABLE "product_vendor" ADD COLUMN "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL;--> statement-breakpoint
ALTER TABLE "product_vendor" ADD COLUMN "is_primary" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "product_vendor" ADD COLUMN "vendor_sku" text;--> statement-breakpoint
ALTER TABLE "product_vendor" ADD COLUMN "moq" integer;--> statement-breakpoint
ALTER TABLE "service_area" ADD COLUMN "zone_tier" text DEFAULT 'express' NOT NULL;--> statement-breakpoint
ALTER TABLE "service_area" ADD COLUMN "eta_minutes" integer DEFAULT 15 NOT NULL;--> statement-breakpoint
ALTER TABLE "service_area" ADD COLUMN "delivery_fee" integer DEFAULT 1500 NOT NULL;--> statement-breakpoint
ALTER TABLE "service_area" ADD COLUMN "free_delivery_threshold" integer DEFAULT 19900 NOT NULL;--> statement-breakpoint
ALTER TABLE "service_area" ADD COLUMN "min_order_value" integer DEFAULT 9900 NOT NULL;--> statement-breakpoint
ALTER TABLE "service_area" ADD COLUMN "distance_from_hub_km" double precision;--> statement-breakpoint
ALTER TABLE "service_area" ADD COLUMN "surge_extra_mins" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "service_area" ADD COLUMN "surge_active" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "service_area" ADD COLUMN "polygon" text;--> statement-breakpoint
ALTER TABLE "vendor" ADD COLUMN "type" text DEFAULT 'distributor' NOT NULL;--> statement-breakpoint
ALTER TABLE "vendor" ADD COLUMN "city" text;--> statement-breakpoint
ALTER TABLE "vendor" ADD COLUMN "state" text;--> statement-breakpoint
ALTER TABLE "vendor" ADD COLUMN "pincode" text;--> statement-breakpoint
ALTER TABLE "vendor" ADD COLUMN "lat" double precision;--> statement-breakpoint
ALTER TABLE "vendor" ADD COLUMN "lng" double precision;--> statement-breakpoint
ALTER TABLE "vendor" ADD COLUMN "pan" text;--> statement-breakpoint
ALTER TABLE "vendor" ADD COLUMN "payment_terms" text DEFAULT 'net_30' NOT NULL;--> statement-breakpoint
ALTER TABLE "vendor" ADD COLUMN "default_lead_time_days" integer;--> statement-breakpoint
ALTER TABLE "vendor" ADD COLUMN "notes" text;--> statement-breakpoint
ALTER TABLE "stock_movement" ADD CONSTRAINT "stock_movement_hub_id_hub_id_fk" FOREIGN KEY ("hub_id") REFERENCES "public"."hub"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movement" ADD CONSTRAINT "stock_movement_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movement" ADD CONSTRAINT "stock_movement_product_size_id_product_size_id_fk" FOREIGN KEY ("product_size_id") REFERENCES "public"."product_size"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movement" ADD CONSTRAINT "stock_movement_product_color_id_product_color_id_fk" FOREIGN KEY ("product_color_id") REFERENCES "public"."product_color"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delivery_assignment" ADD CONSTRAINT "delivery_assignment_order_id_order_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."order"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delivery_assignment" ADD CONSTRAINT "delivery_assignment_rider_id_rider_id_fk" FOREIGN KEY ("rider_id") REFERENCES "public"."rider"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delivery_assignment" ADD CONSTRAINT "delivery_assignment_hub_id_hub_id_fk" FOREIGN KEY ("hub_id") REFERENCES "public"."hub"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rider" ADD CONSTRAINT "rider_hub_id_hub_id_fk" FOREIGN KEY ("hub_id") REFERENCES "public"."hub"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goods_received_note" ADD CONSTRAINT "goods_received_note_purchase_order_id_purchase_order_id_fk" FOREIGN KEY ("purchase_order_id") REFERENCES "public"."purchase_order"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goods_received_note" ADD CONSTRAINT "goods_received_note_hub_id_hub_id_fk" FOREIGN KEY ("hub_id") REFERENCES "public"."hub"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goods_received_note_item" ADD CONSTRAINT "goods_received_note_item_grn_id_goods_received_note_id_fk" FOREIGN KEY ("grn_id") REFERENCES "public"."goods_received_note"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goods_received_note_item" ADD CONSTRAINT "goods_received_note_item_purchase_order_item_id_purchase_order_item_id_fk" FOREIGN KEY ("purchase_order_item_id") REFERENCES "public"."purchase_order_item"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goods_received_note_item" ADD CONSTRAINT "goods_received_note_item_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_order" ADD CONSTRAINT "purchase_order_vendor_id_vendor_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendor"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_order" ADD CONSTRAINT "purchase_order_hub_id_hub_id_fk" FOREIGN KEY ("hub_id") REFERENCES "public"."hub"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_order_item" ADD CONSTRAINT "purchase_order_item_purchase_order_id_purchase_order_id_fk" FOREIGN KEY ("purchase_order_id") REFERENCES "public"."purchase_order"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_order_item" ADD CONSTRAINT "purchase_order_item_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_order_item" ADD CONSTRAINT "purchase_order_item_product_size_id_product_size_id_fk" FOREIGN KEY ("product_size_id") REFERENCES "public"."product_size"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_order_item" ADD CONSTRAINT "purchase_order_item_product_color_id_product_color_id_fk" FOREIGN KEY ("product_color_id") REFERENCES "public"."product_color"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_transfer" ADD CONSTRAINT "stock_transfer_from_hub_id_hub_id_fk" FOREIGN KEY ("from_hub_id") REFERENCES "public"."hub"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_transfer" ADD CONSTRAINT "stock_transfer_to_hub_id_hub_id_fk" FOREIGN KEY ("to_hub_id") REFERENCES "public"."hub"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_transfer_item" ADD CONSTRAINT "stock_transfer_item_transfer_id_stock_transfer_id_fk" FOREIGN KEY ("transfer_id") REFERENCES "public"."stock_transfer"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_transfer_item" ADD CONSTRAINT "stock_transfer_item_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_transfer_item" ADD CONSTRAINT "stock_transfer_item_product_size_id_product_size_id_fk" FOREIGN KEY ("product_size_id") REFERENCES "public"."product_size"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_transfer_item" ADD CONSTRAINT "stock_transfer_item_product_color_id_product_color_id_fk" FOREIGN KEY ("product_color_id") REFERENCES "public"."product_color"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "stock_movement_hub_id_idx" ON "stock_movement" USING btree ("hub_id");--> statement-breakpoint
CREATE INDEX "stock_movement_product_id_idx" ON "stock_movement" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "stock_movement_type_idx" ON "stock_movement" USING btree ("type");--> statement-breakpoint
CREATE INDEX "stock_movement_reference_id_idx" ON "stock_movement" USING btree ("reference_id");--> statement-breakpoint
CREATE INDEX "stock_movement_created_at_idx" ON "stock_movement" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "delivery_assignment_order_id_idx" ON "delivery_assignment" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "delivery_assignment_rider_id_idx" ON "delivery_assignment" USING btree ("rider_id");--> statement-breakpoint
CREATE INDEX "delivery_assignment_status_idx" ON "delivery_assignment" USING btree ("status");--> statement-breakpoint
CREATE INDEX "product_vendor_productId_idx" ON "product_vendor" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "service_area_zone_tier_idx" ON "service_area" USING btree ("zone_tier");--> statement-breakpoint
ALTER TABLE "product_vendor" ADD CONSTRAINT "product_vendor_product_vendor_key" UNIQUE("product_id","vendor_id");