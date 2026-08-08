ALTER TABLE "product" DROP CONSTRAINT "product_sku_unique";--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN "unit_type" text;--> statement-breakpoint
ALTER TABLE "product" DROP COLUMN "sku";--> statement-breakpoint
ALTER TABLE "product_size" ADD COLUMN "sku" text;--> statement-breakpoint
UPDATE "product_size" SET "sku" = 'PS-' || substr("id"::text, 1, 8) WHERE "sku" IS NULL;--> statement-breakpoint
ALTER TABLE "product_size" ALTER COLUMN "sku" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "product_size" ADD CONSTRAINT "product_size_sku_unique" UNIQUE("sku");--> statement-breakpoint
ALTER TABLE "product_size" ADD COLUMN "mrp" integer;--> statement-breakpoint
UPDATE "product_size" SET "mrp" = "price" WHERE "mrp" IS NULL;--> statement-breakpoint
ALTER TABLE "product_size" ALTER COLUMN "mrp" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "product_size" ADD COLUMN "cost_price" integer;--> statement-breakpoint
ALTER TABLE "product_color" ADD COLUMN "sku" text;--> statement-breakpoint
UPDATE "product_color" SET "sku" = 'PC-' || substr("id"::text, 1, 8) WHERE "sku" IS NULL;--> statement-breakpoint
ALTER TABLE "product_color" ALTER COLUMN "sku" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "product_color" ADD CONSTRAINT "product_color_sku_unique" UNIQUE("sku");--> statement-breakpoint
ALTER TABLE "product_color" ADD COLUMN "mrp" integer;--> statement-breakpoint
UPDATE "product_color" SET "mrp" = "price" WHERE "mrp" IS NULL;--> statement-breakpoint
ALTER TABLE "product_color" ALTER COLUMN "mrp" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "product_color" ADD COLUMN "cost_price" integer;
