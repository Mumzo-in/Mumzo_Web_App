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
	CONSTRAINT "coupon_code_unique" UNIQUE("code")
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
ALTER TABLE "coupon" ADD CONSTRAINT "coupon_category_slug_category_slug_fk" FOREIGN KEY ("category_slug") REFERENCES "public"."category"("slug") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon" ADD CONSTRAINT "coupon_brand_id_brand_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brand"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon_assignment" ADD CONSTRAINT "coupon_assignment_coupon_id_coupon_id_fk" FOREIGN KEY ("coupon_id") REFERENCES "public"."coupon"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon_assignment" ADD CONSTRAINT "coupon_assignment_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon_product" ADD CONSTRAINT "coupon_product_coupon_id_coupon_id_fk" FOREIGN KEY ("coupon_id") REFERENCES "public"."coupon"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon_product" ADD CONSTRAINT "coupon_product_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "coupon_categorySlug_idx" ON "coupon" USING btree ("category_slug");--> statement-breakpoint
CREATE INDEX "coupon_brandId_idx" ON "coupon" USING btree ("brand_id");--> statement-breakpoint
CREATE INDEX "coupon_isActive_idx" ON "coupon" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "coupon_assignment_userId_idx" ON "coupon_assignment" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "coupon_product_productId_idx" ON "coupon_product" USING btree ("product_id");