import { pgTable, serial, varchar, text, boolean, timestamp, integer, jsonb, numeric, unique, index, foreignKey } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { projects } from "./tables";

// Enhanced schema for centralized planning activities

// Activity Templates - Reusable activity definitions
export const activityTemplates = pgTable("activity_templates", {
  id: serial().primaryKey().notNull(),
  name: varchar({ length: 200 }).notNull(),
  description: text(),
  categoryType: varchar({ length: 50 }).notNull(), // HR, TRC, PA, HPE, etc.
  tags: text().array(), // ["salary", "medical", "staff"] for flexible grouping
  isActive: boolean().default(true),
  metadata: jsonb(), // Flexible field for additional configuration
  createdAt: timestamp("created_at", { mode: 'date' }).default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at", { mode: 'date' }).default(sql`CURRENT_TIMESTAMP`),
  createdBy: integer("created_by"),
  updatedBy: integer("updated_by"),
}, (table) => [
  unique("activity_templates_name_category_key").on(table.name, table.categoryType),
  index("idx_activity_templates_category").using("btree", table.categoryType),
  index("idx_activity_templates_active").using("btree", table.isActive),
]);

// Enhanced Planning Categories with Versioning
export const planningCategoryVersions = pgTable("planning_category_versions", {
  id: serial().primaryKey().notNull(),
  categoryId: integer("category_id").notNull(),
  version: integer().notNull(),
  projectId: integer("project_id").notNull(),
  facilityType: varchar({ length: 20 }).notNull(), // 'hospital' | 'health_center'
  code: varchar({ length: 10 }).notNull(),
  name: varchar({ length: 100 }).notNull(),
  displayOrder: integer("display_order").notNull(),
  isActive: boolean().default(true),
  validFrom: timestamp("valid_from", { mode: 'date' }).default(sql`CURRENT_TIMESTAMP`),
  validTo: timestamp("valid_to", { mode: 'date' }),
  changeReason: text(),
  createdAt: timestamp("created_at", { mode: 'date' }).default(sql`CURRENT_TIMESTAMP`),
  createdBy: integer("created_by"),
}, (table) => [
  foreignKey({
    columns: [table.projectId],
    foreignColumns: [projects.id],
    name: "planning_category_versions_project_id_fkey"
  }).onDelete("cascade"),
  unique("planning_category_versions_unique").on(table.categoryId, table.version),
  index("idx_planning_cat_versions_active").using("btree", table.isActive),
  index("idx_planning_cat_versions_project").using("btree", table.projectId, table.facilityType),
]);

// Enhanced Planning Activities with Templates
export const planningActivityVersions = pgTable("planning_activity_versions", {
  id: serial().primaryKey().notNull(),
  activityId: integer("activity_id").notNull(),
  version: integer().notNull(),
  templateId: integer("template_id"), // Link to activity template
  categoryVersionId: integer("category_version_id").notNull(),
  facilityType: varchar({ length: 20 }).notNull(),
  name: varchar({ length: 200 }).notNull(),
  displayOrder: integer("display_order").notNull(),
  isTotalRow: boolean("is_total_row").default(false),
  isActive: boolean().default(true),
  validFrom: timestamp("valid_from", { mode: 'date' }).default(sql`CURRENT_TIMESTAMP`),
  validTo: timestamp("valid_to", { mode: 'date' }),
  
  // Configuration fields
  config: jsonb(), // Flexible configuration: validation rules, UI hints, etc.
  defaultFrequency: numeric({ precision: 10, scale: 2 }),
  defaultUnitCost: numeric({ precision: 18, scale: 2 }),
  
  // Audit fields
  changeReason: text(),
  createdAt: timestamp("created_at", { mode: 'date' }).default(sql`CURRENT_TIMESTAMP`),
  createdBy: integer("created_by"),
}, (table) => [
  foreignKey({
    columns: [table.templateId],
    foreignColumns: [activityTemplates.id],
    name: "planning_activity_versions_template_id_fkey"
  }),
  foreignKey({
    columns: [table.categoryVersionId],
    foreignColumns: [planningCategoryVersions.id],
    name: "planning_activity_versions_category_version_id_fkey"
  }).onDelete("cascade"),
  unique("planning_activity_versions_unique").on(table.activityId, table.version),
  index("idx_planning_act_versions_active").using("btree", table.isActive),
  index("idx_planning_act_versions_category").using("btree", table.categoryVersionId),
]);

// Configuration Management
export const planningConfiguration = pgTable("planning_configuration", {
  id: serial().primaryKey().notNull(),
  projectId: integer("project_id").notNull(),
  facilityType: varchar({ length: 20 }).notNull(),
  configKey: varchar({ length: 100 }).notNull(),
  configValue: jsonb().notNull(),
  description: text(),
  isActive: boolean().default(true),
  createdAt: timestamp("created_at", { mode: 'date' }).default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at", { mode: 'date' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  unique("planning_config_unique").on(table.projectId, table.facilityType, table.configKey),
  index("idx_planning_config_active").using("btree", table.isActive),
  index("idx_planning_config_project").using("btree", table.projectId, table.facilityType),
]); 