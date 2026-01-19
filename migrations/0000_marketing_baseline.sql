-- hit:schema-only
-- Auto-generated from pack schema; app Drizzle migrations handle tables.

CREATE TABLE "marketing_activity_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" varchar(100) NOT NULL,
	"name" varchar(255) NOT NULL,
	"category" varchar(50),
	"description" text,
	"color" varchar(50),
	"icon" varchar(100),
	"sort_order" numeric(10, 0) DEFAULT '0',
	"is_system" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "marketing_activity_types_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "marketing_campaign_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	"order" integer NOT NULL,
	"color" varchar(20),
	"is_system" boolean DEFAULT false NOT NULL,
	"customer_config" jsonb,
	"created_by_user_id" varchar(255) NOT NULL,
	"created_on_timestamp" timestamp with time zone DEFAULT now() NOT NULL,
	"last_updated_by_user_id" varchar(255),
	"last_updated_on_timestamp" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "marketing_campaign_types_code_unique" UNIQUE("code"),
	CONSTRAINT "marketing_campaign_types_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "marketing_campaigns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"goals" text,
	"campaign_type_id" uuid,
	"status" varchar(50) DEFAULT 'planned' NOT NULL,
	"start_date" date,
	"end_date" date,
	"budget_amount" numeric(20, 2),
	"division_id" uuid,
	"department_id" uuid,
	"location_id" uuid,
	"owner_user_id" varchar(255),
	"created_by_user_id" varchar(255) NOT NULL,
	"created_on_timestamp" timestamp with time zone DEFAULT now() NOT NULL,
	"last_updated_by_user_id" varchar(255),
	"last_updated_on_timestamp" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "marketing_entity_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"marketing_entity_type" text NOT NULL,
	"marketing_entity_id" uuid NOT NULL,
	"linked_entity_kind" text NOT NULL,
	"linked_entity_id" uuid NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "marketing_entity_links_unique" UNIQUE("marketing_entity_type","marketing_entity_id","linked_entity_kind","linked_entity_id")
);
--> statement-breakpoint
CREATE TABLE "marketing_expenses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plan_id" uuid,
	"type_id" uuid,
	"vendor_id" uuid,
	"occurred_at" timestamp NOT NULL,
	"amount" numeric(20, 2) NOT NULL,
	"notes" text,
	"attachment_url" varchar(500),
	"created_by" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "marketing_plan_type_budgets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plan_id" uuid NOT NULL,
	"activity_type_id" uuid NOT NULL,
	"planned_amount" numeric(20, 2) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "marketing_plan_type_budgets_unique" UNIQUE("plan_id","activity_type_id")
);
--> statement-breakpoint
CREATE TABLE "marketing_plan_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" varchar(100) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"color" varchar(50),
	"icon" varchar(100),
	"sort_order" numeric(10, 0) DEFAULT '0',
	"is_system" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "marketing_plan_types_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "marketing_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type_id" uuid,
	"title" varchar(500) NOT NULL,
	"budget_amount" numeric(20, 2) NOT NULL,
	"spend_amount" numeric(20, 2) DEFAULT '0' NOT NULL,
	"start_date" timestamp,
	"end_date" timestamp,
	"allocate_by_type" boolean DEFAULT false NOT NULL,
	"is_archived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "marketing_vendors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"kind" varchar(50) NOT NULL,
	"link" varchar(500),
	"contact" varchar(500),
	"notes" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "marketing_campaigns" ADD CONSTRAINT "marketing_campaigns_campaign_type_id_marketing_campaign_types_id_fk" FOREIGN KEY ("campaign_type_id") REFERENCES "public"."marketing_campaign_types"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "marketing_campaign_types_order_idx" ON "marketing_campaign_types" USING btree ("order");--> statement-breakpoint
CREATE INDEX "marketing_campaign_types_code_idx" ON "marketing_campaign_types" USING btree ("code");--> statement-breakpoint
CREATE INDEX "marketing_campaign_types_created_by_idx" ON "marketing_campaign_types" USING btree ("created_by_user_id");--> statement-breakpoint
CREATE INDEX "marketing_campaigns_name_idx" ON "marketing_campaigns" USING btree ("name");--> statement-breakpoint
CREATE INDEX "marketing_campaigns_status_idx" ON "marketing_campaigns" USING btree ("status");--> statement-breakpoint
CREATE INDEX "marketing_campaigns_type_idx" ON "marketing_campaigns" USING btree ("campaign_type_id");--> statement-breakpoint
CREATE INDEX "marketing_campaigns_owner_idx" ON "marketing_campaigns" USING btree ("owner_user_id");--> statement-breakpoint
CREATE INDEX "marketing_campaigns_created_by_idx" ON "marketing_campaigns" USING btree ("created_by_user_id");--> statement-breakpoint
CREATE INDEX "marketing_campaigns_ldd_idx" ON "marketing_campaigns" USING btree ("division_id","department_id","location_id");--> statement-breakpoint
CREATE INDEX "marketing_entity_links_marketing_idx" ON "marketing_entity_links" USING btree ("marketing_entity_type","marketing_entity_id");--> statement-breakpoint
CREATE INDEX "marketing_entity_links_linked_idx" ON "marketing_entity_links" USING btree ("linked_entity_kind","linked_entity_id");