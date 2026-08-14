CREATE INDEX "order_couponId_idx" ON "order" USING btree ("coupon_id");--> statement-breakpoint
CREATE INDEX "referral_couponId_idx" ON "referral" USING btree ("coupon_id");--> statement-breakpoint
CREATE INDEX "referral_refereeCouponId_idx" ON "referral" USING btree ("referee_coupon_id");