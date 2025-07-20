import { pgTable, uniqueIndex, foreignKey, serial, varchar, integer, timestamp, boolean, unique, check, text, numeric, index, date, pgView, pgEnum, jsonb } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const facilityType = pgEnum("facility_type", ['hospital', 'health_center'])
export const projectType = pgEnum("project_type", ['HIV', 'Malaria', 'TB'])
export const userRole = pgEnum("user_role", ['accountant', 'admin'])


export const categories = pgTable("categories", {
	id: serial().primaryKey().notNull(),
	code: varchar({ length: 10 }).notNull(),
	name: varchar({ length: 100 }).notNull(),
	displayOrder: integer("display_order").notNull(),
	createdAt: timestamp("created_at", { mode: 'date' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { mode: 'date' }).default(sql`CURRENT_TIMESTAMP`),
	isComputed: boolean("is_computed").default(false).notNull(),
	projectId: integer("project_id").notNull(),
}, (table) => [
	uniqueIndex("categories_project_code_uniq").using("btree", table.projectId.asc().nullsLast().op("int4_ops"), table.code.asc().nullsLast()),
	foreignKey({
			columns: [table.projectId],
			foreignColumns: [projects.id],
			name: "categories_project_fk"
		}).onDelete("cascade"),
]);

export const activityEventMappings = pgTable("activity_event_mappings", {
	id: serial().primaryKey().notNull(),
	activityId: integer("activity_id").notNull(),
	eventId: integer("event_id").notNull(),
	mappingType: varchar("mapping_type", { length: 20 }).default('DIRECT'),
	createdAt: timestamp("created_at", { mode: 'date' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { mode: 'date' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	foreignKey({
			columns: [table.activityId],
			foreignColumns: [activities.id],
			name: "activity_event_mappings_activity_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.eventId],
			foreignColumns: [events.id],
			name: "activity_event_mappings_event_id_fkey"
		}).onDelete("cascade"),
	unique("activity_event_mappings_activity_id_event_id_key").on(table.activityId, table.eventId),
]);

export const categoryEventMappings = pgTable("category_event_mappings", {
	id: serial().primaryKey().notNull(),
	categoryId: integer("category_id"),
	subCategoryId: integer("sub_category_id"),
	eventId: integer("event_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'date' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { mode: 'date' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	uniqueIndex("category_event_unique").using("btree", sql`COALESCE(category_id, 0)`, sql`COALESCE(sub_category_id, 0)`, sql`event_id`),
	foreignKey({
			columns: [table.categoryId],
			foreignColumns: [categories.id],
			name: "category_event_mappings_category_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.subCategoryId],
			foreignColumns: [subCategories.id],
			name: "category_event_mappings_sub_category_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.eventId],
			foreignColumns: [events.id],
			name: "category_event_mappings_event_id_fkey"
		}).onDelete("cascade"),
	check("chk_category_or_subcategory", sql`((category_id IS NOT NULL) AND (sub_category_id IS NULL)) OR ((category_id IS NULL) AND (sub_category_id IS NOT NULL))`),
]);

export const districts = pgTable("districts", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	provinceId: integer("province_id").notNull(),
}, (table) => [
	foreignKey({
			columns: [table.provinceId],
			foreignColumns: [provinces.id],
			name: "districts_province_id_fkey"
		}),
	unique("districts_name_key").on(table.name),
]);

export const executionData = pgTable("execution_data", {
	id: serial().primaryKey().notNull(),
	reportingPeriodId: integer("reporting_period_id"),
	activityId: integer("activity_id"),
	q1Amount: numeric("q1_amount", { precision: 15, scale:  2 }).default('0.00'),
	q2Amount: numeric("q2_amount", { precision: 15, scale:  2 }).default('0.00'),
	q3Amount: numeric("q3_amount", { precision: 15, scale:  2 }).default('0.00'),
	q4Amount: numeric("q4_amount", { precision: 15, scale:  2 }).default('0.00'),
	cumulativeBalance: numeric("cumulative_balance", { precision: 15, scale:  2 }).generatedAlwaysAs(sql`(((q1_amount + q2_amount) + q3_amount) + q4_amount)`),
	comment: text(),
	createdAt: timestamp("created_at", { mode: 'date' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { mode: 'date' }).default(sql`CURRENT_TIMESTAMP`),
	createdBy: varchar("created_by", { length: 100 }),
	updatedBy: varchar("updated_by", { length: 100 }),
	facilityId: integer("facility_id").notNull(),
	projectId: integer("project_id").notNull(),
}, (table) => [
	foreignKey({
			columns: [table.facilityId],
			foreignColumns: [facilities.id],
			name: "execution_data_facility_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.reportingPeriodId],
			foreignColumns: [reportingPeriods.id],
			name: "execution_data_reporting_period_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.activityId],
			foreignColumns: [activities.id],
			name: "execution_data_activity_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.projectId],
			foreignColumns: [projects.id],
			name: "exec_project_fk"
		}).onDelete("cascade"),
	unique("exec_unique").on(table.reportingPeriodId, table.activityId, table.facilityId, table.projectId),
]);

export const budgetAllocations = pgTable("budget_allocations", {
	id: serial().primaryKey().notNull(),
	eventId: integer("event_id").notNull(),
	reportingPeriodId: integer("reporting_period_id").notNull(),
	facilityId: integer("facility_id").notNull(),
	originalBudget: numeric("original_budget", { precision: 15, scale:  2 }).default('0.00'),
	revisedBudget: numeric("revised_budget", { precision: 15, scale:  2 }).default('0.00'),
	q1Budget: numeric("q1_budget", { precision: 15, scale:  2 }).default('0.00'),
	q2Budget: numeric("q2_budget", { precision: 15, scale:  2 }).default('0.00'),
	q3Budget: numeric("q3_budget", { precision: 15, scale:  2 }).default('0.00'),
	q4Budget: numeric("q4_budget", { precision: 15, scale:  2 }).default('0.00'),
	totalBudget: numeric("total_budget", { precision: 15, scale:  2 }).generatedAlwaysAs(sql`(((q1_budget + q2_budget) + q3_budget) + q4_budget)`),
	createdBy: varchar("created_by", { length: 100 }),
	updatedBy: varchar("updated_by", { length: 100 }),
	createdAt: timestamp("created_at", { mode: 'date' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { mode: 'date' }).default(sql`CURRENT_TIMESTAMP`),
	projectId: integer("project_id"),
}, (table) => [
	index("idx_budget_alloc_project").using("btree", table.projectId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.eventId],
			foreignColumns: [events.id],
			name: "budget_allocations_event_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.reportingPeriodId],
			foreignColumns: [reportingPeriods.id],
			name: "budget_allocations_reporting_period_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.facilityId],
			foreignColumns: [facilities.id],
			name: "budget_allocations_facility_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.projectId],
			foreignColumns: [projects.id],
			name: "budget_allocations_project_id_fkey"
		}).onDelete("set null"),
	unique("budget_allocations_event_period_facility_project_key").on(table.eventId, table.reportingPeriodId, table.facilityId, table.projectId),
	check("budget_allocations_project_id_not_null", sql`project_id IS NOT NULL`),
]);

export const account = pgTable("account", {
	id: serial().primaryKey().notNull(),
	accountId: text("account_id").notNull(),
	providerId: text("provider_id").notNull(),
	userId: integer("user_id").notNull(),
	accessToken: text("access_token"),
	refreshToken: text("refresh_token"),
	idToken: text("id_token"),
	accessTokenExpiresAt: timestamp("access_token_expires_at", { mode: 'date' }),
	refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { mode: 'date' }),
	scope: text(),
	password: text(),
	createdAt: timestamp("created_at", { mode: 'date' }).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'date' }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "account_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const events = pgTable("events", {
	id: serial().primaryKey().notNull(),
	noteNumber: integer("note_number").notNull(),
	code: varchar({ length: 50 }).notNull(),
	description: text().notNull(),
	statementCodes: text("statement_codes").array().notNull(),
	eventType: varchar("event_type", { length: 20 }).notNull(),
	isCurrent: boolean("is_current").default(true),
	displayOrder: integer("display_order").notNull(),
	createdAt: timestamp("created_at", { mode: 'date' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { mode: 'date' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	unique("events_note_number_key").on(table.noteNumber),
	unique("events_code_key").on(table.code),
	check("events_event_type_check", sql`(event_type)::text = ANY (ARRAY[('REVENUE'::character varying)::text, ('EXPENSE'::character varying)::text, ('ASSET'::character varying)::text, ('LIABILITY'::character varying)::text, ('EQUITY'::character varying)::text])`),
]);

export const planActivityBudgetMappings = pgTable("plan_activity_budget_mappings", {
	id: serial().primaryKey().notNull(),
	planActivityId: integer("plan_activity_id").notNull(),
	budgetAllocationId: integer("budget_allocation_id").notNull(),
	mappingRatio: numeric("mapping_ratio", { precision: 5, scale:  4 }).default('1.0000'),
	createdAt: timestamp("created_at", { mode: 'date' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { mode: 'date' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	index("idx_pabm_budget").using("btree", table.budgetAllocationId.asc().nullsLast().op("int4_ops")),
	index("idx_pabm_plan").using("btree", table.planActivityId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.budgetAllocationId],
			foreignColumns: [budgetAllocations.id],
			name: "plan_activity_budget_mappings_budget_allocation_id_fkey"
		}).onDelete("cascade"),
	unique("plan_activity_budget_mappings_plan_activity_id_budget_allocatio").on(table.planActivityId, table.budgetAllocationId),
]);

export const planningActivities = pgTable("planning_activities", {
	id: serial().primaryKey().notNull(),
	categoryId: integer("category_id").notNull(),
	facilityType: facilityType("facility_type").notNull(),
	name: varchar({ length: 200 }).notNull(),
	displayOrder: integer("display_order").notNull(),
	isTotalRow: boolean("is_total_row").default(false),
	createdAt: timestamp("created_at", { mode: 'date' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { mode: 'date' }).default(sql`CURRENT_TIMESTAMP`),
	projectId: integer("project_id").notNull(),
}, (table) => [
	index("idx_plan_act_cat_order").using("btree", table.categoryId.asc().nullsLast().op("int4_ops"), table.displayOrder.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.categoryId],
			foreignColumns: [planningCategories.id],
			name: "planning_activities_category_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.projectId],
			foreignColumns: [projects.id],
			name: "planning_activities_project_fk"
		}).onDelete("cascade"),
]);

export const session = pgTable("session", {
	id: serial().primaryKey().notNull(),
	expiresAt: timestamp("expires_at", { mode: 'date' }).notNull(),
	token: text().notNull(),
	createdAt: timestamp("created_at", { mode: 'date' }).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'date' }).notNull(),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	userId: integer("user_id").notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "session_user_id_users_id_fk"
		}).onDelete("cascade"),
	unique("session_token_unique").on(table.token),
]);

export const provinces = pgTable("provinces", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
}, (table) => [
	unique("provinces_name_key").on(table.name),
]);

export const planningData = pgTable("planning_data", {
	id: serial().primaryKey().notNull(),
	activityId: integer("activity_id").notNull(),
	facilityId: integer("facility_id").notNull(),
	reportingPeriodId: integer("reporting_period_id").notNull(),
	projectId: integer("project_id").notNull(),
	frequency: numeric({ precision: 10, scale:  2 }).notNull(),
	unitCost: numeric("unit_cost", { precision: 18, scale:  2 }).notNull(),
	countQ1: integer("count_q1").default(0),
	countQ2: integer("count_q2").default(0),
	countQ3: integer("count_q3").default(0),
	countQ4: integer("count_q4").default(0),
	amountQ1: numeric("amount_q1", { precision: 18, scale:  2 }).generatedAlwaysAs(sql`((frequency * unit_cost) * (count_q1)::numeric)`),
	amountQ2: numeric("amount_q2", { precision: 18, scale:  2 }).generatedAlwaysAs(sql`((frequency * unit_cost) * (count_q2)::numeric)`),
	amountQ3: numeric("amount_q3", { precision: 18, scale:  2 }).generatedAlwaysAs(sql`((frequency * unit_cost) * (count_q3)::numeric)`),
	amountQ4: numeric("amount_q4", { precision: 18, scale:  2 }).generatedAlwaysAs(sql`((frequency * unit_cost) * (count_q4)::numeric)`),
	totalBudget: numeric("total_budget", { precision: 18, scale:  2 }).generatedAlwaysAs(sql`((frequency * unit_cost) * ((((count_q1 + count_q2) + count_q3) + count_q4))::numeric)`),
	comment: text(),
	createdAt: timestamp("created_at", { mode: 'date' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { mode: 'date' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	foreignKey({
			columns: [table.activityId],
			foreignColumns: [planningActivities.id],
			name: "planning_data_activity_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.facilityId],
			foreignColumns: [facilities.id],
			name: "planning_data_facility_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.reportingPeriodId],
			foreignColumns: [reportingPeriods.id],
			name: "planning_data_reporting_period_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.projectId],
			foreignColumns: [projects.id],
			name: "planning_data_project_id_fkey"
		}).onDelete("cascade"),
	unique("plan_data_unique").on(table.activityId, table.facilityId, table.reportingPeriodId, table.projectId),
]);

export const statementTemplates = pgTable("statement_templates", {
	id: serial().primaryKey().notNull(),
	statementCode: varchar("statement_code", { length: 20 }).notNull(),
	statementName: varchar("statement_name", { length: 200 }).notNull(),
	lineItem: varchar("line_item", { length: 200 }).notNull(),
	eventIds: integer("event_ids").array().notNull(),
	calculationFormula: text("calculation_formula"),
	displayOrder: integer("display_order").notNull(),
	isTotalLine: boolean("is_total_line").default(false),
	isSubtotalLine: boolean("is_subtotal_line").default(false),
	parentLineId: integer("parent_line_id"),
	createdAt: timestamp("created_at", { mode: 'date' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { mode: 'date' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	foreignKey({
			columns: [table.parentLineId],
			foreignColumns: [table.id],
			name: "statement_templates_parent_line_id_fkey"
		}).onDelete("set null"),
	unique("statement_templates_code_line_item_key").on(table.statementCode, table.lineItem),
]);

export const reportingPeriods = pgTable("reporting_periods", {
	id: serial().primaryKey().notNull(),
	year: integer().notNull(),
	periodType: varchar("period_type", { length: 20 }).default('ANNUAL'),
	startDate: date("start_date").notNull(),
	endDate: date("end_date").notNull(),
	status: varchar({ length: 20 }).default('ACTIVE'),
	createdAt: timestamp("created_at", { mode: 'date' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { mode: 'date' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	unique("reporting_periods_year_period_type_key").on(table.year, table.periodType),
]);

export const projects = pgTable("projects", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 200 }).notNull(),
	status: varchar({ length: 20 }).default('ACTIVE'),
	createdAt: timestamp("created_at", { mode: 'date' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { mode: 'date' }).default(sql`CURRENT_TIMESTAMP`),
	code: varchar({ length: 10 }).notNull(),
	description: text(),
	projectType: projectType("project_type"),
	facilityId: integer("facility_id"),
	reportingPeriodId: integer("reporting_period_id"),
	userId: integer("user_id"),
}, (table) => [
	foreignKey({
			columns: [table.facilityId],
			foreignColumns: [facilities.id],
			name: "projects_facility_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.reportingPeriodId],
			foreignColumns: [reportingPeriods.id],
			name: "projects_reporting_period_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "projects_user_id_fkey"
		}).onDelete("cascade"),
	unique("projects_name_key").on(table.name),
	unique("projects_code_key").on(table.code),
	check("chk_valid_project_status", sql`(status)::text = ANY (ARRAY[('ACTIVE'::character varying)::text, ('INACTIVE'::character varying)::text, ('ARCHIVED'::character varying)::text])`),
]);

export const planningCategories = pgTable("planning_categories", {
	id: serial().primaryKey().notNull(),
	projectId: integer("project_id").notNull(),
	facilityType: facilityType("facility_type").notNull(),
	code: varchar({ length: 10 }).notNull(),
	name: varchar({ length: 100 }).notNull(),
	displayOrder: integer("display_order").notNull(),
	createdAt: timestamp("created_at", { mode: 'date' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { mode: 'date' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	foreignKey({
			columns: [table.projectId],
			foreignColumns: [projects.id],
			name: "planning_categories_project_id_fkey"
		}).onDelete("cascade"),
	unique("planning_categories_project_ftype_code_key").on(table.projectId, table.facilityType, table.code),
]);

export const verification = pgTable("verification", {
	id: serial().primaryKey().notNull(),
	identifier: text().notNull(),
	value: text().notNull(),
	expiresAt: timestamp("expires_at", { mode: 'date' }).notNull(),
	createdAt: timestamp("created_at", { mode: 'date' }),
	updatedAt: timestamp("updated_at", { mode: 'date' }),
});

export const users = pgTable("users", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	email: text().notNull(),
	emailVerified: boolean("email_verified").notNull(),
	role: userRole().default('accountant').notNull(),
	facilityId: integer("facility_id"),
	createdAt: timestamp("created_at", { mode: 'date' }).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'date' }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.facilityId],
			foreignColumns: [facilities.id],
			name: "users_facility_id_fkey"
		}),
	unique("users_email_key").on(table.email),
]);

export const activities = pgTable("activities", {
	id: serial().primaryKey().notNull(),
	categoryId: integer("category_id"),
	subCategoryId: integer("sub_category_id"),
	name: varchar({ length: 200 }).notNull(),
	displayOrder: integer("display_order").notNull(),
	isTotalRow: boolean("is_total_row").default(false),
	createdAt: timestamp("created_at", { mode: 'date' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { mode: 'date' }).default(sql`CURRENT_TIMESTAMP`),
	projectId: integer("project_id"),
}, (table) => [
	foreignKey({
			columns: [table.categoryId],
			foreignColumns: [categories.id],
			name: "activities_category_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.subCategoryId],
			foreignColumns: [subCategories.id],
			name: "activities_sub_category_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.categoryId, table.subCategoryId],
			foreignColumns: [subCategories.id, subCategories.categoryId],
			name: "fk_activity_subcat_consistency"
		}),
	check("chk_activity_has_one_parent", sql`((category_id IS NOT NULL) AND (sub_category_id IS NULL)) OR ((category_id IS NULL) AND (sub_category_id IS NOT NULL))`),
]);

export const subCategories = pgTable("sub_categories", {
	id: serial().primaryKey().notNull(),
	categoryId: integer("category_id").notNull(),
	code: varchar({ length: 20 }).notNull(),
	name: varchar({ length: 150 }).notNull(),
	displayOrder: integer("display_order").notNull(),
	createdAt: timestamp("created_at", { mode: 'date' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { mode: 'date' }).default(sql`CURRENT_TIMESTAMP`),
	projectId: integer("project_id"),
}, (table) => [
	uniqueIndex("subcat_project_category_code_uniq").using("btree", table.projectId.asc().nullsLast().op("int4_ops"), table.categoryId.asc().nullsLast().op("int4_ops"), table.code.asc().nullsLast()),
	foreignKey({
			columns: [table.categoryId],
			foreignColumns: [categories.id],
			name: "sub_categories_category_id_fkey"
		}).onDelete("cascade"),
	unique("uq_subcat_composite").on(table.id, table.categoryId),
	unique("subcat_proj_cat_code_uniq").on(table.categoryId, table.code, table.projectId),
]);

export const facilities = pgTable("facilities", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	facilityType: facilityType("facility_type").notNull(),
	districtId: integer("district_id").notNull(),
}, (table) => [
	foreignKey({
			columns: [table.districtId],
			foreignColumns: [districts.id],
			name: "facilities_district_id_fkey"
		}),
	unique("facilities_name_district_id_key").on(table.name, table.districtId),
]);

export const financialEvents = pgTable("financial_events", {
	id: serial().primaryKey().notNull(),
	eventId: integer("event_id").notNull(),
	amount: numeric({ precision: 15, scale:  2 }).notNull(),
	direction: varchar({ length: 10 }).notNull(),
	reportingPeriodId: integer("reporting_period_id").notNull(),
	facilityId: integer("facility_id").notNull(),
	quarter: integer(),
	transactionDate: date("transaction_date"),
	referenceNumber: varchar("reference_number", { length: 100 }),
	description: text(),
	sourceTable: varchar("source_table", { length: 50 }),
	sourceId: integer("source_id"),
	createdBy: varchar("created_by", { length: 100 }),
	updatedBy: varchar("updated_by", { length: 100 }),
	createdAt: timestamp("created_at", { mode: 'date' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { mode: 'date' }).default(sql`CURRENT_TIMESTAMP`),
	projectId: integer("project_id"),
}, (table) => [
	index("idx_fin_events_project").using("btree", table.projectId.asc().nullsLast().op("int4_ops")),
	index("idx_fin_events_source").using("btree", table.sourceId.asc().nullsLast().op("int4_ops")),

	foreignKey({
			columns: [table.projectId],
			foreignColumns: [projects.id],
			name: "financial_events_project_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.eventId],
			foreignColumns: [events.id],
			name: "financial_events_event_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.reportingPeriodId],
			foreignColumns: [reportingPeriods.id],
			name: "financial_events_reporting_period_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.facilityId],
			foreignColumns: [facilities.id],
			name: "financial_events_facility_id_fkey"
		}).onDelete("cascade"),
	unique("financial_events_event_period_facility_quarter_source_key").on(table.eventId, table.reportingPeriodId, table.facilityId, table.quarter, table.sourceId),
	check("financial_events_direction_check", sql`(direction)::text = ANY (ARRAY[('DEBIT'::character varying)::text, ('CREDIT'::character varying)::text])`),
	check("financial_events_quarter_check", sql`quarter = ANY (ARRAY[1, 2, 3, 4])`),
	check("financial_events_project_id_not_null", sql`project_id IS NOT NULL`),
]);

export const planningActivityEventMappings = pgTable("planning_activity_event_mappings", {
	id: serial().primaryKey().notNull(),
	planningActivityId: integer("planning_activity_id").notNull(),
	eventId: integer("event_id").notNull(),
	mappingType: varchar("mapping_type", { length: 20 }).default('DIRECT'),
	createdAt: timestamp("created_at", { mode: 'date' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { mode: 'date' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	unique("planning_activity_event_mappings_activity_id_event_id_key").on(table.planningActivityId, table.eventId),
]);

export const vPlanningCategoryTotals = pgView("v_planning_category_totals", {	categoryId: integer("category_id"),
	projectId: integer("project_id"),
	reportingPeriodId: integer("reporting_period_id"),
	facilityId: integer("facility_id"),
	amountQ1: numeric("amount_q1"),
	amountQ2: numeric("amount_q2"),
	amountQ3: numeric("amount_q3"),
	amountQ4: numeric("amount_q4"),
	totalBudget: numeric("total_budget"),
}).as(sql`SELECT pc.id AS category_id, pc.project_id, pd.reporting_period_id, pd.facility_id, sum(pd.amount_q1) AS amount_q1, sum(pd.amount_q2) AS amount_q2, sum(pd.amount_q3) AS amount_q3, sum(pd.amount_q4) AS amount_q4, sum(pd.total_budget) AS total_budget FROM planning_data pd JOIN planning_activities pa ON pa.id = pd.activity_id JOIN planning_categories pc ON pc.id = pa.category_id GROUP BY pc.id, pc.project_id, pd.reporting_period_id, pd.facility_id`); 