CREATE TYPE "public"."facility_type" AS ENUM('hospital', 'health_center');--> statement-breakpoint
CREATE TYPE "public"."project_type" AS ENUM('HIV', 'Malaria', 'TB');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('accountant', 'admin');--> statement-breakpoint
CREATE TABLE "account" (
	"id" serial PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" integer NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "activities" (
	"id" serial PRIMARY KEY NOT NULL,
	"category_id" integer,
	"sub_category_id" integer,
	"name" varchar(200) NOT NULL,
	"display_order" integer NOT NULL,
	"is_total_row" boolean DEFAULT false,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"project_id" integer,
	CONSTRAINT "chk_activity_has_one_parent" CHECK (((category_id IS NOT NULL) AND (sub_category_id IS NULL)) OR ((category_id IS NULL) AND (sub_category_id IS NOT NULL)))
);
--> statement-breakpoint
CREATE TABLE "activity_event_mappings" (
	"id" serial PRIMARY KEY NOT NULL,
	"activity_id" integer NOT NULL,
	"event_id" integer NOT NULL,
	"mapping_type" varchar(20) DEFAULT 'DIRECT',
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "activity_event_mappings_activity_id_event_id_key" UNIQUE("activity_id","event_id")
);
--> statement-breakpoint
CREATE TABLE "budget_allocations" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" integer NOT NULL,
	"reporting_period_id" integer NOT NULL,
	"facility_id" integer NOT NULL,
	"original_budget" numeric(15, 2) DEFAULT '0.00',
	"revised_budget" numeric(15, 2) DEFAULT '0.00',
	"q1_budget" numeric(15, 2) DEFAULT '0.00',
	"q2_budget" numeric(15, 2) DEFAULT '0.00',
	"q3_budget" numeric(15, 2) DEFAULT '0.00',
	"q4_budget" numeric(15, 2) DEFAULT '0.00',
	"total_budget" numeric(15, 2) GENERATED ALWAYS AS ((((q1_budget + q2_budget) + q3_budget) + q4_budget)) STORED,
	"created_by" varchar(100),
	"updated_by" varchar(100),
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"project_id" integer,
	CONSTRAINT "budget_allocations_event_period_facility_project_key" UNIQUE("event_id","reporting_period_id","facility_id","project_id"),
	CONSTRAINT "budget_allocations_project_id_not_null" CHECK (project_id IS NOT NULL)
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(10) NOT NULL,
	"name" varchar(100) NOT NULL,
	"display_order" integer NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"is_computed" boolean DEFAULT false NOT NULL,
	"project_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "category_event_mappings" (
	"id" serial PRIMARY KEY NOT NULL,
	"category_id" integer,
	"sub_category_id" integer,
	"event_id" integer NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "chk_category_or_subcategory" CHECK (((category_id IS NOT NULL) AND (sub_category_id IS NULL)) OR ((category_id IS NULL) AND (sub_category_id IS NOT NULL)))
);
--> statement-breakpoint
CREATE TABLE "districts" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"province_id" integer NOT NULL,
	CONSTRAINT "districts_name_key" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" serial PRIMARY KEY NOT NULL,
	"note_number" integer NOT NULL,
	"code" varchar(50) NOT NULL,
	"description" text NOT NULL,
	"statement_codes" text[] NOT NULL,
	"event_type" varchar(20) NOT NULL,
	"is_current" boolean DEFAULT true,
	"display_order" integer NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "events_note_number_key" UNIQUE("note_number"),
	CONSTRAINT "events_code_key" UNIQUE("code"),
	CONSTRAINT "events_event_type_check" CHECK ((event_type)::text = ANY (ARRAY[('REVENUE'::character varying)::text, ('EXPENSE'::character varying)::text, ('ASSET'::character varying)::text, ('LIABILITY'::character varying)::text, ('EQUITY'::character varying)::text]))
);
--> statement-breakpoint
CREATE TABLE "execution_data" (
	"id" serial PRIMARY KEY NOT NULL,
	"reporting_period_id" integer,
	"activity_id" integer,
	"q1_amount" numeric(15, 2) DEFAULT '0.00',
	"q2_amount" numeric(15, 2) DEFAULT '0.00',
	"q3_amount" numeric(15, 2) DEFAULT '0.00',
	"q4_amount" numeric(15, 2) DEFAULT '0.00',
	"cumulative_balance" numeric(15, 2) GENERATED ALWAYS AS ((((q1_amount + q2_amount) + q3_amount) + q4_amount)) STORED,
	"comment" text,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"created_by" varchar(100),
	"updated_by" varchar(100),
	"facility_id" integer NOT NULL,
	"project_id" integer NOT NULL,
	CONSTRAINT "exec_unique" UNIQUE("reporting_period_id","activity_id","facility_id","project_id")
);
--> statement-breakpoint
CREATE TABLE "facilities" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"facility_type" "facility_type" NOT NULL,
	"district_id" integer NOT NULL,
	CONSTRAINT "facilities_name_district_id_key" UNIQUE("name","district_id")
);
--> statement-breakpoint
CREATE TABLE "financial_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" integer NOT NULL,
	"amount" numeric(15, 2) NOT NULL,
	"direction" varchar(10) NOT NULL,
	"reporting_period_id" integer NOT NULL,
	"facility_id" integer NOT NULL,
	"quarter" integer,
	"transaction_date" date,
	"reference_number" varchar(100),
	"description" text,
	"source_table" varchar(50),
	"source_id" integer,
	"created_by" varchar(100),
	"updated_by" varchar(100),
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"project_id" integer,
	CONSTRAINT "financial_events_event_period_facility_quarter_source_key" UNIQUE("event_id","reporting_period_id","facility_id","quarter","source_id"),
	CONSTRAINT "financial_events_direction_check" CHECK ((direction)::text = ANY (ARRAY[('DEBIT'::character varying)::text, ('CREDIT'::character varying)::text])),
	CONSTRAINT "financial_events_quarter_check" CHECK (quarter = ANY (ARRAY[1, 2, 3, 4])),
	CONSTRAINT "financial_events_project_id_not_null" CHECK (project_id IS NOT NULL)
);
--> statement-breakpoint
CREATE TABLE "plan_activity_budget_mappings" (
	"id" serial PRIMARY KEY NOT NULL,
	"plan_activity_id" integer NOT NULL,
	"budget_allocation_id" integer NOT NULL,
	"mapping_ratio" numeric(5, 4) DEFAULT '1.0000',
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "plan_activity_budget_mappings_plan_activity_id_budget_allocatio" UNIQUE("plan_activity_id","budget_allocation_id")
);
--> statement-breakpoint
CREATE TABLE "planning_activities" (
	"id" serial PRIMARY KEY NOT NULL,
	"category_id" integer NOT NULL,
	"facility_type" "facility_type" NOT NULL,
	"name" varchar(200) NOT NULL,
	"display_order" integer NOT NULL,
	"is_total_row" boolean DEFAULT false,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"project_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "planning_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"facility_type" "facility_type" NOT NULL,
	"code" varchar(10) NOT NULL,
	"name" varchar(100) NOT NULL,
	"display_order" integer NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "planning_categories_project_ftype_code_key" UNIQUE("project_id","facility_type","code")
);
--> statement-breakpoint
CREATE TABLE "planning_data" (
	"id" serial PRIMARY KEY NOT NULL,
	"activity_id" integer NOT NULL,
	"facility_id" integer NOT NULL,
	"reporting_period_id" integer NOT NULL,
	"project_id" integer NOT NULL,
	"frequency" numeric(10, 2) NOT NULL,
	"unit_cost" numeric(18, 2) NOT NULL,
	"count_q1" integer DEFAULT 0,
	"count_q2" integer DEFAULT 0,
	"count_q3" integer DEFAULT 0,
	"count_q4" integer DEFAULT 0,
	"amount_q1" numeric(18, 2) GENERATED ALWAYS AS (((frequency * unit_cost) * (count_q1)::numeric)) STORED,
	"amount_q2" numeric(18, 2) GENERATED ALWAYS AS (((frequency * unit_cost) * (count_q2)::numeric)) STORED,
	"amount_q3" numeric(18, 2) GENERATED ALWAYS AS (((frequency * unit_cost) * (count_q3)::numeric)) STORED,
	"amount_q4" numeric(18, 2) GENERATED ALWAYS AS (((frequency * unit_cost) * (count_q4)::numeric)) STORED,
	"total_budget" numeric(18, 2) GENERATED ALWAYS AS (((frequency * unit_cost) * ((((count_q1 + count_q2) + count_q3) + count_q4))::numeric)) STORED,
	"comment" text,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "plan_data_unique" UNIQUE("activity_id","facility_id","reporting_period_id","project_id")
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(200) NOT NULL,
	"status" varchar(20) DEFAULT 'ACTIVE',
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"code" varchar(10) NOT NULL,
	"description" text,
	"project_type" "project_type",
	"facility_id" integer,
	"reporting_period_id" integer,
	"user_id" integer,
	CONSTRAINT "projects_name_key" UNIQUE("name"),
	CONSTRAINT "projects_code_key" UNIQUE("code"),
	CONSTRAINT "chk_valid_project_status" CHECK ((status)::text = ANY (ARRAY[('ACTIVE'::character varying)::text, ('INACTIVE'::character varying)::text, ('ARCHIVED'::character varying)::text]))
);
--> statement-breakpoint
CREATE TABLE "provinces" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	CONSTRAINT "provinces_name_key" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "reporting_periods" (
	"id" serial PRIMARY KEY NOT NULL,
	"year" integer NOT NULL,
	"period_type" varchar(20) DEFAULT 'ANNUAL',
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"status" varchar(20) DEFAULT 'ACTIVE',
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "reporting_periods_year_period_type_key" UNIQUE("year","period_type")
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" serial PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" integer NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "statement_templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"statement_code" varchar(20) NOT NULL,
	"statement_name" varchar(200) NOT NULL,
	"line_item" varchar(200) NOT NULL,
	"event_ids" integer[] NOT NULL,
	"calculation_formula" text,
	"display_order" integer NOT NULL,
	"is_total_line" boolean DEFAULT false,
	"is_subtotal_line" boolean DEFAULT false,
	"parent_line_id" integer,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "statement_templates_code_line_item_key" UNIQUE("statement_code","line_item")
);
--> statement-breakpoint
CREATE TABLE "sub_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"category_id" integer NOT NULL,
	"code" varchar(20) NOT NULL,
	"name" varchar(150) NOT NULL,
	"display_order" integer NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"project_id" integer,
	CONSTRAINT "uq_subcat_composite" UNIQUE("id","category_id"),
	CONSTRAINT "subcat_proj_cat_code_uniq" UNIQUE("category_id","code","project_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean NOT NULL,
	"role" "user_role" DEFAULT 'accountant' NOT NULL,
	"facility_id" integer,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "users_email_key" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" serial PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_sub_category_id_fkey" FOREIGN KEY ("sub_category_id") REFERENCES "public"."sub_categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "fk_activity_subcat_consistency" FOREIGN KEY ("category_id","sub_category_id") REFERENCES "public"."sub_categories"("id","category_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_event_mappings" ADD CONSTRAINT "activity_event_mappings_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_event_mappings" ADD CONSTRAINT "activity_event_mappings_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budget_allocations" ADD CONSTRAINT "budget_allocations_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budget_allocations" ADD CONSTRAINT "budget_allocations_reporting_period_id_fkey" FOREIGN KEY ("reporting_period_id") REFERENCES "public"."reporting_periods"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budget_allocations" ADD CONSTRAINT "budget_allocations_facility_id_fkey" FOREIGN KEY ("facility_id") REFERENCES "public"."facilities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budget_allocations" ADD CONSTRAINT "budget_allocations_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_project_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "category_event_mappings" ADD CONSTRAINT "category_event_mappings_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "category_event_mappings" ADD CONSTRAINT "category_event_mappings_sub_category_id_fkey" FOREIGN KEY ("sub_category_id") REFERENCES "public"."sub_categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "category_event_mappings" ADD CONSTRAINT "category_event_mappings_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "districts" ADD CONSTRAINT "districts_province_id_fkey" FOREIGN KEY ("province_id") REFERENCES "public"."provinces"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "execution_data" ADD CONSTRAINT "execution_data_reporting_period_id_fkey" FOREIGN KEY ("reporting_period_id") REFERENCES "public"."reporting_periods"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "execution_data" ADD CONSTRAINT "execution_data_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "execution_data" ADD CONSTRAINT "execution_data_facility_id_fkey" FOREIGN KEY ("facility_id") REFERENCES "public"."facilities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "execution_data" ADD CONSTRAINT "exec_project_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "facilities" ADD CONSTRAINT "facilities_district_id_fkey" FOREIGN KEY ("district_id") REFERENCES "public"."districts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_events" ADD CONSTRAINT "financial_events_source_execution_data_fk" FOREIGN KEY ("source_id") REFERENCES "public"."execution_data"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_events" ADD CONSTRAINT "financial_events_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_events" ADD CONSTRAINT "financial_events_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_events" ADD CONSTRAINT "financial_events_reporting_period_id_fkey" FOREIGN KEY ("reporting_period_id") REFERENCES "public"."reporting_periods"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_events" ADD CONSTRAINT "financial_events_facility_id_fkey" FOREIGN KEY ("facility_id") REFERENCES "public"."facilities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plan_activity_budget_mappings" ADD CONSTRAINT "plan_activity_budget_mappings_budget_allocation_id_fkey" FOREIGN KEY ("budget_allocation_id") REFERENCES "public"."budget_allocations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "planning_activities" ADD CONSTRAINT "planning_activities_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."planning_categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "planning_activities" ADD CONSTRAINT "planning_activities_project_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "planning_categories" ADD CONSTRAINT "planning_categories_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "planning_data" ADD CONSTRAINT "planning_data_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "public"."planning_activities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "planning_data" ADD CONSTRAINT "planning_data_facility_id_fkey" FOREIGN KEY ("facility_id") REFERENCES "public"."facilities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "planning_data" ADD CONSTRAINT "planning_data_reporting_period_id_fkey" FOREIGN KEY ("reporting_period_id") REFERENCES "public"."reporting_periods"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "planning_data" ADD CONSTRAINT "planning_data_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_facility_id_fkey" FOREIGN KEY ("facility_id") REFERENCES "public"."facilities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_reporting_period_id_fkey" FOREIGN KEY ("reporting_period_id") REFERENCES "public"."reporting_periods"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "statement_templates" ADD CONSTRAINT "statement_templates_parent_line_id_fkey" FOREIGN KEY ("parent_line_id") REFERENCES "public"."statement_templates"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sub_categories" ADD CONSTRAINT "sub_categories_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_facility_id_fkey" FOREIGN KEY ("facility_id") REFERENCES "public"."facilities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_budget_alloc_project" ON "budget_allocations" USING btree ("project_id" int4_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "categories_project_code_uniq" ON "categories" USING btree ("project_id" int4_ops,"code");--> statement-breakpoint
CREATE UNIQUE INDEX "category_event_unique" ON "category_event_mappings" USING btree (COALESCE(category_id, 0),COALESCE(sub_category_id, 0),event_id);--> statement-breakpoint
CREATE INDEX "idx_fin_events_project" ON "financial_events" USING btree ("project_id" int4_ops);--> statement-breakpoint
CREATE INDEX "idx_fin_events_source" ON "financial_events" USING btree ("source_id" int4_ops);--> statement-breakpoint
CREATE INDEX "idx_pabm_budget" ON "plan_activity_budget_mappings" USING btree ("budget_allocation_id" int4_ops);--> statement-breakpoint
CREATE INDEX "idx_pabm_plan" ON "plan_activity_budget_mappings" USING btree ("plan_activity_id" int4_ops);--> statement-breakpoint
CREATE INDEX "idx_plan_act_cat_order" ON "planning_activities" USING btree ("category_id" int4_ops,"display_order" int4_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "subcat_project_category_code_uniq" ON "sub_categories" USING btree ("project_id" int4_ops,"category_id" int4_ops,"code");--> statement-breakpoint
CREATE VIEW "public"."v_planning_category_totals" AS (SELECT pc.id AS category_id, pc.project_id, pd.reporting_period_id, pd.facility_id, sum(pd.amount_q1) AS amount_q1, sum(pd.amount_q2) AS amount_q2, sum(pd.amount_q3) AS amount_q3, sum(pd.amount_q4) AS amount_q4, sum(pd.total_budget) AS total_budget FROM planning_data pd JOIN planning_activities pa ON pa.id = pd.activity_id JOIN planning_categories pc ON pc.id = pa.category_id GROUP BY pc.id, pc.project_id, pd.reporting_period_id, pd.facility_id);