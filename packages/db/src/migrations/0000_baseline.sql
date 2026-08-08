-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "staff_verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"phone_number" text,
	"phone_number_verified" boolean DEFAULT false,
	"onboarded_at" timestamp,
	CONSTRAINT "user_email_unique" UNIQUE("email"),
	CONSTRAINT "user_phone_number_unique" UNIQUE("phone_number")
);
--> statement-breakpoint
CREATE TABLE "staff_user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"role" text,
	"banned" boolean DEFAULT false,
	"ban_reason" text,
	"ban_expires" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "staff_user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "staff_account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "staff_session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	"impersonated_by" text,
	CONSTRAINT "staff_session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "staff_role" (
	"id" text PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"label" text NOT NULL,
	"description" text,
	"is_system" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "staff_role_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "category" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"tagline" text,
	"img" text,
	"color" text,
	"position" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"has_sizes" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "category_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "hub" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"address" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"type" text DEFAULT 'dark_store' NOT NULL,
	"city" text,
	"state" text,
	"pincode" text,
	"contact_name" text,
	"contact_phone" text,
	"capacity" integer,
	"operating_hours_start" text,
	"operating_hours_end" text,
	"avg_pick_pack_mins" integer DEFAULT 3 NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"lat" double precision,
	"lng" double precision
);
--> statement-breakpoint
CREATE TABLE "brand" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"logo_url" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "brand_name_unique" UNIQUE("name"),
	CONSTRAINT "brand_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "product_size" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"label" text NOT NULL,
	"price" integer NOT NULL,
	"stock" integer DEFAULT 0 NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"gst_rate" integer DEFAULT 5 NOT NULL,
	"hsn" text,
	"weight_grams" integer DEFAULT 0 NOT NULL,
	"barcode" text,
	"sku" text NOT NULL,
	"mrp" integer NOT NULL,
	"cost_price" integer,
	"qty" text NOT NULL,
	CONSTRAINT "product_size_productId_label_key" UNIQUE("product_id","label"),
	CONSTRAINT "product_size_barcode_unique" UNIQUE("barcode"),
	CONSTRAINT "product_size_sku_unique" UNIQUE("sku")
);
--> statement-breakpoint
CREATE TABLE "product" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"brand_id" uuid NOT NULL,
	"category_id" uuid NOT NULL,
	"price" integer NOT NULL,
	"mrp" integer NOT NULL,
	"qty" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"about" text DEFAULT '' NOT NULL,
	"highlights" text[] DEFAULT '{""}' NOT NULL,
	"country_of_origin" text DEFAULT 'India' NOT NULL,
	"images" text[] DEFAULT '{""}' NOT NULL,
	"ages" text[] DEFAULT '{""}' NOT NULL,
	"type" text NOT NULL,
	"tags" text[] DEFAULT '{""}' NOT NULL,
	"is_bestseller" boolean DEFAULT false NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"rating" numeric(2, 1) DEFAULT '0' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"gst_rate" integer DEFAULT 5 NOT NULL,
	"hsn" text,
	"weight_grams" integer DEFAULT 0 NOT NULL,
	"barcode" text,
	"unit_type" text,
	CONSTRAINT "product_slug_unique" UNIQUE("slug"),
	CONSTRAINT "product_barcode_unique" UNIQUE("barcode")
);
--> statement-breakpoint
CREATE TABLE "vendor" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"address" text,
	"gstin" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"city" text,
	"state" text,
	"pincode" text,
	"lat" double precision,
	"lng" double precision,
	"pan" text,
	"payment_terms" text DEFAULT 'net_30' NOT NULL,
	"default_lead_time_days" integer,
	"notes" text,
	"contacts" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"type" text DEFAULT 'distributor' NOT NULL,
	CONSTRAINT "vendor_name_unique" UNIQUE("name"),
	CONSTRAINT "vendor_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "coupon" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"description" text,
	"type" text NOT NULL,
	"value" integer NOT NULL,
	"cap" integer,
	"min_amt" integer DEFAULT 0 NOT NULL,
	"category_slug" text,
	"brand_id" uuid,
	"product_scope" text DEFAULT 'all' NOT NULL,
	"visibility" text DEFAULT 'public' NOT NULL,
	"segment" text,
	"first_order_only" boolean DEFAULT false NOT NULL,
	"max_uses" integer,
	"max_uses_per_user" integer,
	"used_count" integer DEFAULT 0 NOT NULL,
	"is_stackable" boolean DEFAULT false NOT NULL,
	"priority" integer DEFAULT 0 NOT NULL,
	"expires_at" timestamp NOT NULL,
	"starts_at" timestamp,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"is_global" boolean DEFAULT false NOT NULL,
	CONSTRAINT "coupon_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "upload_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp NOT NULL,
	"finalized" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bundle" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"price" integer NOT NULL,
	"images" text[] DEFAULT '{""}' NOT NULL,
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
CREATE TABLE "baby" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"dob" date NOT NULL,
	"gender" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_color" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"label" text NOT NULL,
	"price" integer NOT NULL,
	"stock" integer DEFAULT 0 NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"gst_rate" integer DEFAULT 5 NOT NULL,
	"hsn" text,
	"weight_grams" integer DEFAULT 0 NOT NULL,
	"barcode" text,
	"sku" text NOT NULL,
	"mrp" integer NOT NULL,
	"cost_price" integer,
	"qty" text NOT NULL,
	CONSTRAINT "product_color_productId_label_key" UNIQUE("product_id","label"),
	CONSTRAINT "product_color_barcode_unique" UNIQUE("barcode"),
	CONSTRAINT "product_color_sku_unique" UNIQUE("sku")
);
--> statement-breakpoint
CREATE TABLE "address" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"label" text NOT NULL,
	"name" text NOT NULL,
	"phone" text NOT NULL,
	"line1" text NOT NULL,
	"line2" text NOT NULL,
	"landmark" text,
	"pincode" text NOT NULL,
	"city" text NOT NULL,
	"lat" double precision,
	"lng" double precision,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_vendor" (
	"product_id" uuid NOT NULL,
	"vendor_id" uuid NOT NULL,
	"relationship" text DEFAULT 'distributor' NOT NULL,
	"cost_price" integer,
	"lead_time_days" integer,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"vendor_sku" text,
	"moq" integer,
	CONSTRAINT "product_vendor_product_id_key" UNIQUE("product_id")
);
--> statement-breakpoint
CREATE TABLE "cart" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text,
	"guest_session_id" text,
	"coupon_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cart_item" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cart_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"product_size_id" uuid,
	"product_color_id" uuid,
	"qty" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"hub_id" uuid NOT NULL,
	"coupon_id" uuid,
	"status" text DEFAULT 'pending_payment' NOT NULL,
	"address_label" text NOT NULL,
	"address_name" text NOT NULL,
	"address_phone" text NOT NULL,
	"address_line1" text NOT NULL,
	"address_line2" text NOT NULL,
	"address_landmark" text,
	"address_pincode" text NOT NULL,
	"address_city" text NOT NULL,
	"subtotal" integer NOT NULL,
	"gst_amount" integer NOT NULL,
	"delivery_fee" integer NOT NULL,
	"discount" integer DEFAULT 0 NOT NULL,
	"total" integer NOT NULL,
	"idempotency_key" text NOT NULL,
	"placed_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "order_idempotency_key_unique" UNIQUE("idempotency_key")
);
--> statement-breakpoint
CREATE TABLE "order_status_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"from_status" text,
	"to_status" text NOT NULL,
	"actor" text NOT NULL,
	"note" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"provider" text NOT NULL,
	"provider_order_id" text,
	"provider_payment_id" text,
	"status" text DEFAULT 'created' NOT NULL,
	"amount" integer NOT NULL,
	"method" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "payment_provider_payment_id_unique" UNIQUE("provider_payment_id")
);
--> statement-breakpoint
CREATE TABLE "refund" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"payment_id" uuid NOT NULL,
	"amount" integer NOT NULL,
	"reason" text NOT NULL,
	"provider_refund_id" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text,
	"template_id" text NOT NULL,
	"channel" text NOT NULL,
	"status" text NOT NULL,
	"provider_message_id" text,
	"error" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"staff_user_id" text
);
--> statement-breakpoint
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
CREATE TABLE "service_area" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"pincode" text NOT NULL,
	"hub_id" uuid NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"zone_tier" text DEFAULT 'express' NOT NULL,
	"eta_minutes" integer DEFAULT 15 NOT NULL,
	"delivery_fee" integer DEFAULT 1500 NOT NULL,
	"free_delivery_threshold" integer DEFAULT 19900 NOT NULL,
	"min_order_value" integer DEFAULT 9900 NOT NULL,
	"distance_from_hub_km" double precision,
	"surge_extra_mins" integer DEFAULT 0 NOT NULL,
	"surge_active" boolean DEFAULT false NOT NULL,
	"polygon" text,
	CONSTRAINT "service_area_pincode_unique" UNIQUE("pincode")
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
CREATE TABLE "staff_activity_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"staff_user_id" text NOT NULL,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text,
	"description" text NOT NULL,
	"previous_values" jsonb,
	"new_values" jsonb,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
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
CREATE TABLE "referral_tier" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"threshold" integer NOT NULL,
	"coupon_amount" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "referral_tier_threshold_unique" UNIQUE("threshold")
);
--> statement-breakpoint
CREATE TABLE "referral" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"referrer_user_id" text NOT NULL,
	"referee_user_id" text,
	"code_used" text NOT NULL,
	"status" text DEFAULT 'link_shared' NOT NULL,
	"first_order_id" uuid,
	"delivered_at" timestamp,
	"return_window_end" timestamp,
	"completed_at" timestamp,
	"coupon_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_referral_code" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"code" text NOT NULL,
	"successful_referrals" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_referral_code_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "user_referral_code_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "order_item" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"product_size_id" uuid,
	"product_color_id" uuid,
	"name_snapshot" text NOT NULL,
	"price_snapshot" integer NOT NULL,
	"gst_rate_snapshot" integer NOT NULL,
	"hsn_snapshot" text NOT NULL,
	"weight_grams_snapshot" integer NOT NULL,
	"qty" integer NOT NULL,
	"variant_label_snapshot" text
);
--> statement-breakpoint
CREATE TABLE "inventory" (
	"hub_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"stock" integer DEFAULT 0 NOT NULL,
	"reorder_point" integer DEFAULT 12 NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_size_id" uuid,
	"product_color_id" uuid,
	CONSTRAINT "inventory_hub_product_variant_key" UNIQUE("hub_id","product_id","product_size_id","product_color_id")
);
--> statement-breakpoint
CREATE TABLE "category_brand" (
	"category_id" uuid NOT NULL,
	"brand_id" uuid NOT NULL,
	CONSTRAINT "category_brand_category_id_brand_id_pk" PRIMARY KEY("category_id","brand_id")
);
--> statement-breakpoint
CREATE TABLE "coupon_assignment" (
	"coupon_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	CONSTRAINT "coupon_assignment_coupon_id_user_id_pk" PRIMARY KEY("coupon_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "coupon_product" (
	"coupon_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	CONSTRAINT "coupon_product_coupon_id_product_id_pk" PRIMARY KEY("coupon_id","product_id")
);
--> statement-breakpoint
CREATE TABLE "wishlist" (
	"user_id" text NOT NULL,
	"product_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "wishlist_user_id_product_id_pk" PRIMARY KEY("user_id","product_id")
);
--> statement-breakpoint
CREATE TABLE "staff_role_permission" (
	"role_id" text NOT NULL,
	"resource" text NOT NULL,
	"action" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "staff_role_permission_role_id_resource_action_pk" PRIMARY KEY("role_id","resource","action")
);
--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_account" ADD CONSTRAINT "staff_account_user_id_staff_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."staff_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_session" ADD CONSTRAINT "staff_session_user_id_staff_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."staff_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_size" ADD CONSTRAINT "product_size_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product" ADD CONSTRAINT "product_brand_id_brand_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brand"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product" ADD CONSTRAINT "product_category_id_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."category"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon" ADD CONSTRAINT "coupon_brand_id_brand_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brand"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon" ADD CONSTRAINT "coupon_category_slug_category_slug_fk" FOREIGN KEY ("category_slug") REFERENCES "public"."category"("slug") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "upload_sessions" ADD CONSTRAINT "upload_sessions_user_id_staff_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."staff_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bundle_item" ADD CONSTRAINT "bundle_item_bundle_id_bundle_id_fk" FOREIGN KEY ("bundle_id") REFERENCES "public"."bundle"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bundle_item" ADD CONSTRAINT "bundle_item_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "baby" ADD CONSTRAINT "baby_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_color" ADD CONSTRAINT "product_color_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "address" ADD CONSTRAINT "address_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_vendor" ADD CONSTRAINT "product_vendor_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_vendor" ADD CONSTRAINT "product_vendor_vendor_id_vendor_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendor"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart" ADD CONSTRAINT "cart_coupon_id_coupon_id_fk" FOREIGN KEY ("coupon_id") REFERENCES "public"."coupon"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart" ADD CONSTRAINT "cart_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart_item" ADD CONSTRAINT "cart_item_cart_id_cart_id_fk" FOREIGN KEY ("cart_id") REFERENCES "public"."cart"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart_item" ADD CONSTRAINT "cart_item_product_color_id_product_color_id_fk" FOREIGN KEY ("product_color_id") REFERENCES "public"."product_color"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart_item" ADD CONSTRAINT "cart_item_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart_item" ADD CONSTRAINT "cart_item_product_size_id_product_size_id_fk" FOREIGN KEY ("product_size_id") REFERENCES "public"."product_size"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order" ADD CONSTRAINT "order_coupon_id_coupon_id_fk" FOREIGN KEY ("coupon_id") REFERENCES "public"."coupon"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order" ADD CONSTRAINT "order_hub_id_hub_id_fk" FOREIGN KEY ("hub_id") REFERENCES "public"."hub"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order" ADD CONSTRAINT "order_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_status_log" ADD CONSTRAINT "order_status_log_order_id_order_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."order"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment" ADD CONSTRAINT "payment_order_id_order_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."order"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refund" ADD CONSTRAINT "refund_payment_id_payment_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payment"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_log" ADD CONSTRAINT "notification_log_staff_user_id_staff_user_id_fk" FOREIGN KEY ("staff_user_id") REFERENCES "public"."staff_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_log" ADD CONSTRAINT "notification_log_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movement" ADD CONSTRAINT "stock_movement_hub_id_hub_id_fk" FOREIGN KEY ("hub_id") REFERENCES "public"."hub"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movement" ADD CONSTRAINT "stock_movement_product_color_id_product_color_id_fk" FOREIGN KEY ("product_color_id") REFERENCES "public"."product_color"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movement" ADD CONSTRAINT "stock_movement_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movement" ADD CONSTRAINT "stock_movement_product_size_id_product_size_id_fk" FOREIGN KEY ("product_size_id") REFERENCES "public"."product_size"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_device" ADD CONSTRAINT "staff_device_staff_user_id_staff_user_id_fk" FOREIGN KEY ("staff_user_id") REFERENCES "public"."staff_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_device" ADD CONSTRAINT "user_device_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delivery_assignment" ADD CONSTRAINT "delivery_assignment_hub_id_hub_id_fk" FOREIGN KEY ("hub_id") REFERENCES "public"."hub"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delivery_assignment" ADD CONSTRAINT "delivery_assignment_order_id_order_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."order"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delivery_assignment" ADD CONSTRAINT "delivery_assignment_rider_id_rider_id_fk" FOREIGN KEY ("rider_id") REFERENCES "public"."rider"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rider" ADD CONSTRAINT "rider_hub_id_hub_id_fk" FOREIGN KEY ("hub_id") REFERENCES "public"."hub"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_area" ADD CONSTRAINT "service_area_hub_id_hub_id_fk" FOREIGN KEY ("hub_id") REFERENCES "public"."hub"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_order" ADD CONSTRAINT "purchase_order_hub_id_hub_id_fk" FOREIGN KEY ("hub_id") REFERENCES "public"."hub"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_order" ADD CONSTRAINT "purchase_order_vendor_id_vendor_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendor"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goods_received_note" ADD CONSTRAINT "goods_received_note_hub_id_hub_id_fk" FOREIGN KEY ("hub_id") REFERENCES "public"."hub"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goods_received_note" ADD CONSTRAINT "goods_received_note_purchase_order_id_purchase_order_id_fk" FOREIGN KEY ("purchase_order_id") REFERENCES "public"."purchase_order"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goods_received_note_item" ADD CONSTRAINT "goods_received_note_item_grn_id_goods_received_note_id_fk" FOREIGN KEY ("grn_id") REFERENCES "public"."goods_received_note"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goods_received_note_item" ADD CONSTRAINT "goods_received_note_item_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goods_received_note_item" ADD CONSTRAINT "goods_received_note_item_purchase_order_item_id_purchase_order_" FOREIGN KEY ("purchase_order_item_id") REFERENCES "public"."purchase_order_item"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_order_item" ADD CONSTRAINT "purchase_order_item_product_color_id_product_color_id_fk" FOREIGN KEY ("product_color_id") REFERENCES "public"."product_color"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_order_item" ADD CONSTRAINT "purchase_order_item_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_order_item" ADD CONSTRAINT "purchase_order_item_product_size_id_product_size_id_fk" FOREIGN KEY ("product_size_id") REFERENCES "public"."product_size"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_order_item" ADD CONSTRAINT "purchase_order_item_purchase_order_id_purchase_order_id_fk" FOREIGN KEY ("purchase_order_id") REFERENCES "public"."purchase_order"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_transfer" ADD CONSTRAINT "stock_transfer_from_hub_id_hub_id_fk" FOREIGN KEY ("from_hub_id") REFERENCES "public"."hub"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_transfer" ADD CONSTRAINT "stock_transfer_to_hub_id_hub_id_fk" FOREIGN KEY ("to_hub_id") REFERENCES "public"."hub"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_transfer_item" ADD CONSTRAINT "stock_transfer_item_product_color_id_product_color_id_fk" FOREIGN KEY ("product_color_id") REFERENCES "public"."product_color"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_transfer_item" ADD CONSTRAINT "stock_transfer_item_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_transfer_item" ADD CONSTRAINT "stock_transfer_item_product_size_id_product_size_id_fk" FOREIGN KEY ("product_size_id") REFERENCES "public"."product_size"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_transfer_item" ADD CONSTRAINT "stock_transfer_item_transfer_id_stock_transfer_id_fk" FOREIGN KEY ("transfer_id") REFERENCES "public"."stock_transfer"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_activity_log" ADD CONSTRAINT "staff_activity_log_staff_user_id_staff_user_id_fk" FOREIGN KEY ("staff_user_id") REFERENCES "public"."staff_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_event" ADD CONSTRAINT "customer_event_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral" ADD CONSTRAINT "referral_coupon_id_coupon_id_fk" FOREIGN KEY ("coupon_id") REFERENCES "public"."coupon"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral" ADD CONSTRAINT "referral_first_order_id_order_id_fk" FOREIGN KEY ("first_order_id") REFERENCES "public"."order"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral" ADD CONSTRAINT "referral_referee_user_id_user_id_fk" FOREIGN KEY ("referee_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral" ADD CONSTRAINT "referral_referrer_user_id_user_id_fk" FOREIGN KEY ("referrer_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_referral_code" ADD CONSTRAINT "user_referral_code_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_item" ADD CONSTRAINT "order_item_order_id_order_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."order"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_item" ADD CONSTRAINT "order_item_product_color_id_product_color_id_fk" FOREIGN KEY ("product_color_id") REFERENCES "public"."product_color"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_item" ADD CONSTRAINT "order_item_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_item" ADD CONSTRAINT "order_item_product_size_id_product_size_id_fk" FOREIGN KEY ("product_size_id") REFERENCES "public"."product_size"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_hub_id_hub_id_fk" FOREIGN KEY ("hub_id") REFERENCES "public"."hub"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_product_color_id_product_color_id_fk" FOREIGN KEY ("product_color_id") REFERENCES "public"."product_color"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_product_size_id_product_size_id_fk" FOREIGN KEY ("product_size_id") REFERENCES "public"."product_size"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "category_brand" ADD CONSTRAINT "category_brand_brand_id_brand_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brand"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "category_brand" ADD CONSTRAINT "category_brand_category_id_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."category"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon_assignment" ADD CONSTRAINT "coupon_assignment_coupon_id_coupon_id_fk" FOREIGN KEY ("coupon_id") REFERENCES "public"."coupon"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon_assignment" ADD CONSTRAINT "coupon_assignment_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon_product" ADD CONSTRAINT "coupon_product_coupon_id_coupon_id_fk" FOREIGN KEY ("coupon_id") REFERENCES "public"."coupon"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon_product" ADD CONSTRAINT "coupon_product_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wishlist" ADD CONSTRAINT "wishlist_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wishlist" ADD CONSTRAINT "wishlist_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_role_permission" ADD CONSTRAINT "staff_role_permission_role_id_staff_role_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."staff_role"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "session" USING btree ("user_id" text_ops);--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "account" USING btree ("user_id" text_ops);--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier" text_ops);--> statement-breakpoint
CREATE INDEX "staff_verification_identifier_idx" ON "staff_verification" USING btree ("identifier" text_ops);--> statement-breakpoint
CREATE INDEX "staff_account_userId_idx" ON "staff_account" USING btree ("user_id" text_ops);--> statement-breakpoint
CREATE INDEX "staff_session_userId_idx" ON "staff_session" USING btree ("user_id" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "hub_single_default_idx" ON "hub" USING btree ("is_default" bool_ops) WHERE (is_default = true);--> statement-breakpoint
CREATE INDEX "brand_name_trgm_idx" ON "brand" USING gin ("name" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "product_size_productId_idx" ON "product_size" USING btree ("product_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "product_brandId_idx" ON "product" USING btree ("brand_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "product_categoryId_idx" ON "product" USING btree ("category_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "product_name_trgm_idx" ON "product" USING gin ("name" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "product_status_idx" ON "product" USING btree ("status" text_ops);--> statement-breakpoint
CREATE INDEX "coupon_brandId_idx" ON "coupon" USING btree ("brand_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "coupon_categorySlug_idx" ON "coupon" USING btree ("category_slug" text_ops);--> statement-breakpoint
CREATE INDEX "coupon_isActive_idx" ON "coupon" USING btree ("is_active" bool_ops);--> statement-breakpoint
CREATE INDEX "bundle_status_idx" ON "bundle" USING btree ("status" text_ops);--> statement-breakpoint
CREATE INDEX "bundle_item_bundleId_idx" ON "bundle_item" USING btree ("bundle_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "bundle_item_productId_idx" ON "bundle_item" USING btree ("product_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "product_color_productId_idx" ON "product_color" USING btree ("product_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "address_userId_idx" ON "address" USING btree ("user_id" text_ops);--> statement-breakpoint
CREATE INDEX "product_vendor_vendorId_idx" ON "product_vendor" USING btree ("vendor_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "cart_guestSessionId_idx" ON "cart" USING btree ("guest_session_id" text_ops);--> statement-breakpoint
CREATE INDEX "cart_userId_idx" ON "cart" USING btree ("user_id" text_ops);--> statement-breakpoint
CREATE INDEX "cart_item_cartId_idx" ON "cart_item" USING btree ("cart_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "cart_item_productColorId_idx" ON "cart_item" USING btree ("product_color_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "cart_item_productId_idx" ON "cart_item" USING btree ("product_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "cart_item_productSizeId_idx" ON "cart_item" USING btree ("product_size_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "order_hubId_idx" ON "order" USING btree ("hub_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "order_status_idx" ON "order" USING btree ("status" text_ops);--> statement-breakpoint
CREATE INDEX "order_userId_idx" ON "order" USING btree ("user_id" text_ops);--> statement-breakpoint
CREATE INDEX "order_status_log_orderId_idx" ON "order_status_log" USING btree ("order_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "payment_orderId_idx" ON "payment" USING btree ("order_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "payment_status_idx" ON "payment" USING btree ("status" text_ops);--> statement-breakpoint
CREATE INDEX "refund_paymentId_idx" ON "refund" USING btree ("payment_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "notification_log_staffUserId_idx" ON "notification_log" USING btree ("staff_user_id" text_ops);--> statement-breakpoint
CREATE INDEX "notification_log_templateId_idx" ON "notification_log" USING btree ("template_id" text_ops);--> statement-breakpoint
CREATE INDEX "notification_log_userId_idx" ON "notification_log" USING btree ("user_id" text_ops);--> statement-breakpoint
CREATE INDEX "stock_movement_created_at_idx" ON "stock_movement" USING btree ("created_at" timestamp_ops);--> statement-breakpoint
CREATE INDEX "stock_movement_hub_id_idx" ON "stock_movement" USING btree ("hub_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "stock_movement_product_id_idx" ON "stock_movement" USING btree ("product_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "stock_movement_reference_id_idx" ON "stock_movement" USING btree ("reference_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "stock_movement_type_idx" ON "stock_movement" USING btree ("type" text_ops);--> statement-breakpoint
CREATE INDEX "staff_device_deviceId_idx" ON "staff_device" USING btree ("device_id" text_ops);--> statement-breakpoint
CREATE INDEX "staff_device_staffUserId_idx" ON "staff_device" USING btree ("staff_user_id" text_ops);--> statement-breakpoint
CREATE INDEX "user_device_deviceId_idx" ON "user_device" USING btree ("device_id" text_ops);--> statement-breakpoint
CREATE INDEX "user_device_userId_idx" ON "user_device" USING btree ("user_id" text_ops);--> statement-breakpoint
CREATE INDEX "delivery_assignment_order_id_idx" ON "delivery_assignment" USING btree ("order_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "delivery_assignment_rider_id_idx" ON "delivery_assignment" USING btree ("rider_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "delivery_assignment_status_idx" ON "delivery_assignment" USING btree ("status" text_ops);--> statement-breakpoint
CREATE INDEX "service_area_zone_tier_idx" ON "service_area" USING btree ("zone_tier" text_ops);--> statement-breakpoint
CREATE INDEX "staff_activity_log_created_at_idx" ON "staff_activity_log" USING btree ("created_at" timestamp_ops);--> statement-breakpoint
CREATE INDEX "staff_activity_log_entity_type_entity_id_idx" ON "staff_activity_log" USING btree ("entity_type" text_ops,"entity_id" text_ops);--> statement-breakpoint
CREATE INDEX "staff_activity_log_staff_user_id_idx" ON "staff_activity_log" USING btree ("staff_user_id" text_ops);--> statement-breakpoint
CREATE INDEX "customer_event_action_idx" ON "customer_event" USING btree ("action" text_ops);--> statement-breakpoint
CREATE INDEX "customer_event_userId_createdAt_idx" ON "customer_event" USING btree ("user_id" timestamp_ops,"created_at" text_ops);--> statement-breakpoint
CREATE INDEX "customer_event_userId_idx" ON "customer_event" USING btree ("user_id" text_ops);--> statement-breakpoint
CREATE INDEX "referral_tier_threshold_idx" ON "referral_tier" USING btree ("threshold" int4_ops);--> statement-breakpoint
CREATE INDEX "referral_refereeUserId_idx" ON "referral" USING btree ("referee_user_id" text_ops);--> statement-breakpoint
CREATE INDEX "referral_referrerUserId_idx" ON "referral" USING btree ("referrer_user_id" text_ops);--> statement-breakpoint
CREATE INDEX "referral_returnWindowEnd_idx" ON "referral" USING btree ("return_window_end" timestamp_ops);--> statement-breakpoint
CREATE INDEX "referral_status_idx" ON "referral" USING btree ("status" text_ops);--> statement-breakpoint
CREATE INDEX "user_referral_code_userId_idx" ON "user_referral_code" USING btree ("user_id" text_ops);--> statement-breakpoint
CREATE INDEX "order_item_orderId_idx" ON "order_item" USING btree ("order_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "order_item_productId_idx" ON "order_item" USING btree ("product_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "inventory_productId_idx" ON "inventory" USING btree ("product_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "category_brand_brandId_idx" ON "category_brand" USING btree ("brand_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "coupon_assignment_userId_idx" ON "coupon_assignment" USING btree ("user_id" text_ops);--> statement-breakpoint
CREATE INDEX "coupon_product_productId_idx" ON "coupon_product" USING btree ("product_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "wishlist_userId_idx" ON "wishlist" USING btree ("user_id" text_ops);--> statement-breakpoint
CREATE INDEX "staff_role_permission_roleId_idx" ON "staff_role_permission" USING btree ("role_id" text_ops);
*/