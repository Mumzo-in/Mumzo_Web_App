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
	"qty" integer NOT NULL
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
ALTER TABLE "product" ADD COLUMN "gst_rate" integer DEFAULT 5 NOT NULL;--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN "hsn" text;--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN "weight_grams" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN "barcode" text;--> statement-breakpoint
ALTER TABLE "product_color" ADD COLUMN "gst_rate" integer DEFAULT 5 NOT NULL;--> statement-breakpoint
ALTER TABLE "product_color" ADD COLUMN "hsn" text;--> statement-breakpoint
ALTER TABLE "product_color" ADD COLUMN "weight_grams" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "product_color" ADD COLUMN "barcode" text;--> statement-breakpoint
ALTER TABLE "product_size" ADD COLUMN "gst_rate" integer DEFAULT 5 NOT NULL;--> statement-breakpoint
ALTER TABLE "product_size" ADD COLUMN "hsn" text;--> statement-breakpoint
ALTER TABLE "product_size" ADD COLUMN "weight_grams" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "product_size" ADD COLUMN "barcode" text;--> statement-breakpoint
ALTER TABLE "cart" ADD CONSTRAINT "cart_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart" ADD CONSTRAINT "cart_coupon_id_coupon_id_fk" FOREIGN KEY ("coupon_id") REFERENCES "public"."coupon"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart_item" ADD CONSTRAINT "cart_item_cart_id_cart_id_fk" FOREIGN KEY ("cart_id") REFERENCES "public"."cart"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart_item" ADD CONSTRAINT "cart_item_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart_item" ADD CONSTRAINT "cart_item_product_size_id_product_size_id_fk" FOREIGN KEY ("product_size_id") REFERENCES "public"."product_size"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart_item" ADD CONSTRAINT "cart_item_product_color_id_product_color_id_fk" FOREIGN KEY ("product_color_id") REFERENCES "public"."product_color"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order" ADD CONSTRAINT "order_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order" ADD CONSTRAINT "order_hub_id_hub_id_fk" FOREIGN KEY ("hub_id") REFERENCES "public"."hub"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order" ADD CONSTRAINT "order_coupon_id_coupon_id_fk" FOREIGN KEY ("coupon_id") REFERENCES "public"."coupon"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_item" ADD CONSTRAINT "order_item_order_id_order_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."order"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_item" ADD CONSTRAINT "order_item_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_item" ADD CONSTRAINT "order_item_product_size_id_product_size_id_fk" FOREIGN KEY ("product_size_id") REFERENCES "public"."product_size"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_item" ADD CONSTRAINT "order_item_product_color_id_product_color_id_fk" FOREIGN KEY ("product_color_id") REFERENCES "public"."product_color"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_status_log" ADD CONSTRAINT "order_status_log_order_id_order_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."order"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment" ADD CONSTRAINT "payment_order_id_order_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."order"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refund" ADD CONSTRAINT "refund_payment_id_payment_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payment"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "cart_userId_idx" ON "cart" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "cart_guestSessionId_idx" ON "cart" USING btree ("guest_session_id");--> statement-breakpoint
CREATE INDEX "cart_item_cartId_idx" ON "cart_item" USING btree ("cart_id");--> statement-breakpoint
CREATE INDEX "cart_item_productId_idx" ON "cart_item" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "cart_item_productSizeId_idx" ON "cart_item" USING btree ("product_size_id");--> statement-breakpoint
CREATE INDEX "cart_item_productColorId_idx" ON "cart_item" USING btree ("product_color_id");--> statement-breakpoint
CREATE INDEX "order_userId_idx" ON "order" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "order_hubId_idx" ON "order" USING btree ("hub_id");--> statement-breakpoint
CREATE INDEX "order_status_idx" ON "order" USING btree ("status");--> statement-breakpoint
CREATE INDEX "order_item_orderId_idx" ON "order_item" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "order_item_productId_idx" ON "order_item" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "order_status_log_orderId_idx" ON "order_status_log" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "payment_orderId_idx" ON "payment" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "payment_status_idx" ON "payment" USING btree ("status");--> statement-breakpoint
CREATE INDEX "refund_paymentId_idx" ON "refund" USING btree ("payment_id");--> statement-breakpoint
ALTER TABLE "product" ADD CONSTRAINT "product_barcode_unique" UNIQUE("barcode");--> statement-breakpoint
ALTER TABLE "product_color" ADD CONSTRAINT "product_color_barcode_unique" UNIQUE("barcode");--> statement-breakpoint
ALTER TABLE "product_size" ADD CONSTRAINT "product_size_barcode_unique" UNIQUE("barcode");--> statement-breakpoint
-- Data migration: existing money columns were whole rupees; convert to
-- integer paise so cart/order/payment math (which is paise-native) lines up.
UPDATE "product" SET "price" = "price" * 100, "mrp" = "mrp" * 100;--> statement-breakpoint
UPDATE "product_size" SET "price" = "price" * 100;--> statement-breakpoint
UPDATE "product_color" SET "price" = "price" * 100;--> statement-breakpoint
UPDATE "bundle" SET "price" = "price" * 100;--> statement-breakpoint
UPDATE "coupon" SET "value" = "value" * 100 WHERE "type" = 'flat';--> statement-breakpoint
UPDATE "coupon" SET "cap" = "cap" * 100 WHERE "cap" IS NOT NULL;--> statement-breakpoint
UPDATE "coupon" SET "min_amt" = "min_amt" * 100;