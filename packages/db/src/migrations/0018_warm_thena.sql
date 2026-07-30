ALTER TABLE "inventory" DROP CONSTRAINT "inventory_hub_id_product_id_pk";--> statement-breakpoint
ALTER TABLE "inventory" ADD COLUMN "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL;--> statement-breakpoint
ALTER TABLE "inventory" ADD COLUMN "product_size_id" uuid;--> statement-breakpoint
ALTER TABLE "inventory" ADD COLUMN "product_color_id" uuid;--> statement-breakpoint
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_product_size_id_product_size_id_fk" FOREIGN KEY ("product_size_id") REFERENCES "public"."product_size"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_product_color_id_product_color_id_fk" FOREIGN KEY ("product_color_id") REFERENCES "public"."product_color"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_hub_product_variant_key" UNIQUE("hub_id","product_id","product_size_id","product_color_id");