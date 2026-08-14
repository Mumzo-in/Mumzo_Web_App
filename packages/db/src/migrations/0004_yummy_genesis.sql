ALTER TABLE "goods_received_note_item" DROP CONSTRAINT "goods_received_note_item_purchase_order_item_id_purchase_order_";
--> statement-breakpoint
DROP INDEX "brand_name_trgm_idx";--> statement-breakpoint
DROP INDEX "product_name_trgm_idx";--> statement-breakpoint
DROP INDEX "session_userId_idx";--> statement-breakpoint
DROP INDEX "account_userId_idx";--> statement-breakpoint
DROP INDEX "verification_identifier_idx";--> statement-breakpoint
DROP INDEX "staff_verification_identifier_idx";--> statement-breakpoint
DROP INDEX "staff_account_userId_idx";--> statement-breakpoint
DROP INDEX "staff_session_userId_idx";--> statement-breakpoint
DROP INDEX "hub_single_default_idx";--> statement-breakpoint
DROP INDEX "product_size_productId_idx";--> statement-breakpoint
DROP INDEX "product_brandId_idx";--> statement-breakpoint
DROP INDEX "product_categoryId_idx";--> statement-breakpoint
DROP INDEX "product_status_idx";--> statement-breakpoint
DROP INDEX "coupon_brandId_idx";--> statement-breakpoint
DROP INDEX "coupon_categorySlug_idx";--> statement-breakpoint
DROP INDEX "coupon_isActive_idx";--> statement-breakpoint
DROP INDEX "bundle_status_idx";--> statement-breakpoint
DROP INDEX "bundle_item_bundleId_idx";--> statement-breakpoint
DROP INDEX "bundle_item_productId_idx";--> statement-breakpoint
DROP INDEX "product_color_productId_idx";--> statement-breakpoint
DROP INDEX "address_userId_idx";--> statement-breakpoint
DROP INDEX "product_vendor_vendorId_idx";--> statement-breakpoint
DROP INDEX "cart_guestSessionId_idx";--> statement-breakpoint
DROP INDEX "cart_userId_idx";--> statement-breakpoint
DROP INDEX "cart_item_cartId_idx";--> statement-breakpoint
DROP INDEX "cart_item_productColorId_idx";--> statement-breakpoint
DROP INDEX "cart_item_productId_idx";--> statement-breakpoint
DROP INDEX "cart_item_productSizeId_idx";--> statement-breakpoint
DROP INDEX "order_hubId_idx";--> statement-breakpoint
DROP INDEX "order_status_idx";--> statement-breakpoint
DROP INDEX "order_userId_idx";--> statement-breakpoint
DROP INDEX "order_status_log_orderId_idx";--> statement-breakpoint
DROP INDEX "payment_orderId_idx";--> statement-breakpoint
DROP INDEX "payment_status_idx";--> statement-breakpoint
DROP INDEX "refund_paymentId_idx";--> statement-breakpoint
DROP INDEX "notification_log_staffUserId_idx";--> statement-breakpoint
DROP INDEX "notification_log_templateId_idx";--> statement-breakpoint
DROP INDEX "notification_log_userId_idx";--> statement-breakpoint
DROP INDEX "stock_movement_created_at_idx";--> statement-breakpoint
DROP INDEX "stock_movement_hub_id_idx";--> statement-breakpoint
DROP INDEX "stock_movement_product_id_idx";--> statement-breakpoint
DROP INDEX "stock_movement_reference_id_idx";--> statement-breakpoint
DROP INDEX "stock_movement_type_idx";--> statement-breakpoint
DROP INDEX "staff_device_deviceId_idx";--> statement-breakpoint
DROP INDEX "staff_device_staffUserId_idx";--> statement-breakpoint
DROP INDEX "user_device_deviceId_idx";--> statement-breakpoint
DROP INDEX "user_device_userId_idx";--> statement-breakpoint
DROP INDEX "delivery_assignment_order_id_idx";--> statement-breakpoint
DROP INDEX "delivery_assignment_rider_id_idx";--> statement-breakpoint
DROP INDEX "delivery_assignment_status_idx";--> statement-breakpoint
DROP INDEX "service_area_zone_tier_idx";--> statement-breakpoint
DROP INDEX "staff_activity_log_created_at_idx";--> statement-breakpoint
DROP INDEX "staff_activity_log_entity_type_entity_id_idx";--> statement-breakpoint
DROP INDEX "staff_activity_log_staff_user_id_idx";--> statement-breakpoint
DROP INDEX "customer_event_action_idx";--> statement-breakpoint
DROP INDEX "customer_event_userId_createdAt_idx";--> statement-breakpoint
DROP INDEX "customer_event_userId_idx";--> statement-breakpoint
DROP INDEX "referral_tier_threshold_idx";--> statement-breakpoint
DROP INDEX "referral_refereeUserId_idx";--> statement-breakpoint
DROP INDEX "referral_referrerUserId_idx";--> statement-breakpoint
DROP INDEX "referral_returnWindowEnd_idx";--> statement-breakpoint
DROP INDEX "referral_status_idx";--> statement-breakpoint
DROP INDEX "user_referral_code_userId_idx";--> statement-breakpoint
DROP INDEX "order_item_orderId_idx";--> statement-breakpoint
DROP INDEX "order_item_productId_idx";--> statement-breakpoint
DROP INDEX "inventory_productId_idx";--> statement-breakpoint
DROP INDEX "category_brand_brandId_idx";--> statement-breakpoint
DROP INDEX "coupon_assignment_userId_idx";--> statement-breakpoint
DROP INDEX "coupon_product_productId_idx";--> statement-breakpoint
DROP INDEX "wishlist_userId_idx";--> statement-breakpoint
DROP INDEX "staff_role_permission_roleId_idx";--> statement-breakpoint
ALTER TABLE "product" ALTER COLUMN "highlights" SET DEFAULT '{}';--> statement-breakpoint
ALTER TABLE "product" ALTER COLUMN "images" SET DEFAULT '{}';--> statement-breakpoint
ALTER TABLE "product" ALTER COLUMN "ages" SET DEFAULT '{}';--> statement-breakpoint
ALTER TABLE "product" ALTER COLUMN "tags" SET DEFAULT '{}';--> statement-breakpoint
ALTER TABLE "bundle" ALTER COLUMN "images" SET DEFAULT '{}';--> statement-breakpoint
ALTER TABLE "product_vendor" ADD PRIMARY KEY ("id");--> statement-breakpoint
ALTER TABLE "hub" ADD COLUMN IF NOT EXISTS "service_radius_km" integer DEFAULT 5 NOT NULL;--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN IF NOT EXISTS "is_top_deal" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "cart_item" ADD COLUMN IF NOT EXISTS "selected" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "referral" ADD COLUMN IF NOT EXISTS "referee_coupon_id" uuid;--> statement-breakpoint
ALTER TABLE "goods_received_note_item" ADD CONSTRAINT "goods_received_note_item_purchase_order_item_id_purchase_order_item_id_fk" FOREIGN KEY ("purchase_order_item_id") REFERENCES "public"."purchase_order_item"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral" ADD CONSTRAINT "referral_referee_coupon_id_coupon_id_fk" FOREIGN KEY ("referee_coupon_id") REFERENCES "public"."coupon"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");--> statement-breakpoint
CREATE INDEX "staff_verification_identifier_idx" ON "staff_verification" USING btree ("identifier");--> statement-breakpoint
CREATE INDEX "staff_account_userId_idx" ON "staff_account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "staff_session_userId_idx" ON "staff_session" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "hub_single_default_idx" ON "hub" USING btree ("is_default") WHERE "hub"."is_default" = true;--> statement-breakpoint
CREATE INDEX "product_size_productId_idx" ON "product_size" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "product_brandId_idx" ON "product" USING btree ("brand_id");--> statement-breakpoint
CREATE INDEX "product_categoryId_idx" ON "product" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "product_status_idx" ON "product" USING btree ("status");--> statement-breakpoint
CREATE INDEX "coupon_brandId_idx" ON "coupon" USING btree ("brand_id");--> statement-breakpoint
CREATE INDEX "coupon_categorySlug_idx" ON "coupon" USING btree ("category_slug");--> statement-breakpoint
CREATE INDEX "coupon_isActive_idx" ON "coupon" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "bundle_status_idx" ON "bundle" USING btree ("status");--> statement-breakpoint
CREATE INDEX "bundle_item_bundleId_idx" ON "bundle_item" USING btree ("bundle_id");--> statement-breakpoint
CREATE INDEX "bundle_item_productId_idx" ON "bundle_item" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "product_color_productId_idx" ON "product_color" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "address_userId_idx" ON "address" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "product_vendor_vendorId_idx" ON "product_vendor" USING btree ("vendor_id");--> statement-breakpoint
CREATE INDEX "cart_guestSessionId_idx" ON "cart" USING btree ("guest_session_id");--> statement-breakpoint
CREATE INDEX "cart_userId_idx" ON "cart" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "cart_item_cartId_idx" ON "cart_item" USING btree ("cart_id");--> statement-breakpoint
CREATE INDEX "cart_item_productColorId_idx" ON "cart_item" USING btree ("product_color_id");--> statement-breakpoint
CREATE INDEX "cart_item_productId_idx" ON "cart_item" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "cart_item_productSizeId_idx" ON "cart_item" USING btree ("product_size_id");--> statement-breakpoint
CREATE INDEX "order_hubId_idx" ON "order" USING btree ("hub_id");--> statement-breakpoint
CREATE INDEX "order_status_idx" ON "order" USING btree ("status");--> statement-breakpoint
CREATE INDEX "order_userId_idx" ON "order" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "order_status_log_orderId_idx" ON "order_status_log" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "payment_orderId_idx" ON "payment" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "payment_status_idx" ON "payment" USING btree ("status");--> statement-breakpoint
CREATE INDEX "refund_paymentId_idx" ON "refund" USING btree ("payment_id");--> statement-breakpoint
CREATE INDEX "notification_log_staffUserId_idx" ON "notification_log" USING btree ("staff_user_id");--> statement-breakpoint
CREATE INDEX "notification_log_templateId_idx" ON "notification_log" USING btree ("template_id");--> statement-breakpoint
CREATE INDEX "notification_log_userId_idx" ON "notification_log" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "stock_movement_created_at_idx" ON "stock_movement" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "stock_movement_hub_id_idx" ON "stock_movement" USING btree ("hub_id");--> statement-breakpoint
CREATE INDEX "stock_movement_product_id_idx" ON "stock_movement" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "stock_movement_reference_id_idx" ON "stock_movement" USING btree ("reference_id");--> statement-breakpoint
CREATE INDEX "stock_movement_type_idx" ON "stock_movement" USING btree ("type");--> statement-breakpoint
CREATE INDEX "staff_device_deviceId_idx" ON "staff_device" USING btree ("device_id");--> statement-breakpoint
CREATE INDEX "staff_device_staffUserId_idx" ON "staff_device" USING btree ("staff_user_id");--> statement-breakpoint
CREATE INDEX "user_device_deviceId_idx" ON "user_device" USING btree ("device_id");--> statement-breakpoint
CREATE INDEX "user_device_userId_idx" ON "user_device" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "delivery_assignment_order_id_idx" ON "delivery_assignment" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "delivery_assignment_rider_id_idx" ON "delivery_assignment" USING btree ("rider_id");--> statement-breakpoint
CREATE INDEX "delivery_assignment_status_idx" ON "delivery_assignment" USING btree ("status");--> statement-breakpoint
CREATE INDEX "service_area_zone_tier_idx" ON "service_area" USING btree ("zone_tier");--> statement-breakpoint
CREATE INDEX "staff_activity_log_created_at_idx" ON "staff_activity_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "staff_activity_log_entity_type_entity_id_idx" ON "staff_activity_log" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "staff_activity_log_staff_user_id_idx" ON "staff_activity_log" USING btree ("staff_user_id");--> statement-breakpoint
CREATE INDEX "customer_event_action_idx" ON "customer_event" USING btree ("action");--> statement-breakpoint
CREATE INDEX "customer_event_userId_createdAt_idx" ON "customer_event" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "customer_event_userId_idx" ON "customer_event" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "referral_tier_threshold_idx" ON "referral_tier" USING btree ("threshold");--> statement-breakpoint
CREATE INDEX "referral_refereeUserId_idx" ON "referral" USING btree ("referee_user_id");--> statement-breakpoint
CREATE INDEX "referral_referrerUserId_idx" ON "referral" USING btree ("referrer_user_id");--> statement-breakpoint
CREATE INDEX "referral_returnWindowEnd_idx" ON "referral" USING btree ("return_window_end");--> statement-breakpoint
CREATE INDEX "referral_status_idx" ON "referral" USING btree ("status");--> statement-breakpoint
CREATE INDEX "user_referral_code_userId_idx" ON "user_referral_code" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "order_item_orderId_idx" ON "order_item" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "order_item_productId_idx" ON "order_item" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "inventory_productId_idx" ON "inventory" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "category_brand_brandId_idx" ON "category_brand" USING btree ("brand_id");--> statement-breakpoint
CREATE INDEX "coupon_assignment_userId_idx" ON "coupon_assignment" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "coupon_product_productId_idx" ON "coupon_product" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "wishlist_userId_idx" ON "wishlist" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "staff_role_permission_roleId_idx" ON "staff_role_permission" USING btree ("role_id");