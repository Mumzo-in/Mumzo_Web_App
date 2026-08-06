ALTER TABLE "product_vendor" DROP CONSTRAINT "product_vendor_product_vendor_key";--> statement-breakpoint
DROP INDEX "product_vendor_productId_idx";--> statement-breakpoint
ALTER TABLE "product_vendor" ADD CONSTRAINT "product_vendor_product_id_key" UNIQUE("product_id");