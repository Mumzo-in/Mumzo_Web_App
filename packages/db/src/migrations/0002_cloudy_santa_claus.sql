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
CREATE TABLE "staff_role_permission" (
	"role_id" text NOT NULL,
	"resource" text NOT NULL,
	"action" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "staff_role_permission_role_id_resource_action_pk" PRIMARY KEY("role_id","resource","action")
);
--> statement-breakpoint
ALTER TABLE "staff_role_permission" ADD CONSTRAINT "staff_role_permission_role_id_staff_role_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."staff_role"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "staff_role_permission_roleId_idx" ON "staff_role_permission" USING btree ("role_id");