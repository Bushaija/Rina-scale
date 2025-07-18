import { relations } from "drizzle-orm/relations";
import { 
  projects, 
  categories, 
  activities, 
  activityEventMappings, 
  events, 
  categoryEventMappings, 
  subCategories, 
  provinces, 
  districts, 
  facilities, 
  executionData, 
  reportingPeriods, 
  budgetAllocations, 
  users, 
  account, 
  planActivityBudgetMappings, 
  planningCategories, 
  planningActivities, 
  session, 
  planningData, 
  statementTemplates, 
  financialEvents 
} from "./tables";

export const categoriesRelations = relations(categories, ({one, many}) => ({
	project: one(projects, {
		fields: [categories.projectId],
		references: [projects.id]
	}),
	categoryEventMappings: many(categoryEventMappings),
	activities: many(activities),
	subCategories: many(subCategories),
}));

export const projectsRelations = relations(projects, ({one, many}) => ({
	categories: many(categories),
	executionData: many(executionData),
	budgetAllocations: many(budgetAllocations),
	planningActivities: many(planningActivities),
	planningData: many(planningData),
	facility: one(facilities, {
		fields: [projects.facilityId],
		references: [facilities.id]
	}),
	reportingPeriod: one(reportingPeriods, {
		fields: [projects.reportingPeriodId],
		references: [reportingPeriods.id]
	}),
	user: one(users, {
		fields: [projects.userId],
		references: [users.id]
	}),
	planningCategories: many(planningCategories),
	financialEvents: many(financialEvents),
}));

export const activityEventMappingsRelations = relations(activityEventMappings, ({one}) => ({
	activity: one(activities, {
		fields: [activityEventMappings.activityId],
		references: [activities.id]
	}),
	event: one(events, {
		fields: [activityEventMappings.eventId],
		references: [events.id]
	}),
}));

export const activitiesRelations = relations(activities, ({one, many}) => ({
	activityEventMappings: many(activityEventMappings),
	executionData: many(executionData),
	category: one(categories, {
		fields: [activities.categoryId],
		references: [categories.id]
	}),
	subCategory: one(subCategories, {
		fields: [activities.subCategoryId],
		references: [subCategories.id]
	}),
}));

export const eventsRelations = relations(events, ({many}) => ({
	activityEventMappings: many(activityEventMappings),
	categoryEventMappings: many(categoryEventMappings),
	budgetAllocations: many(budgetAllocations),
	financialEvents: many(financialEvents),
}));

export const categoryEventMappingsRelations = relations(categoryEventMappings, ({one}) => ({
	category: one(categories, {
		fields: [categoryEventMappings.categoryId],
		references: [categories.id]
	}),
	subCategory: one(subCategories, {
		fields: [categoryEventMappings.subCategoryId],
		references: [subCategories.id]
	}),
	event: one(events, {
		fields: [categoryEventMappings.eventId],
		references: [events.id]
	}),
}));

export const subCategoriesRelations = relations(subCategories, ({one, many}) => ({
	categoryEventMappings: many(categoryEventMappings),
	activities: many(activities),
	category: one(categories, {
		fields: [subCategories.categoryId],
		references: [categories.id]
	}),
}));

export const districtsRelations = relations(districts, ({one, many}) => ({
	province: one(provinces, {
		fields: [districts.provinceId],
		references: [provinces.id]
	}),
	facilities: many(facilities),
}));

export const provincesRelations = relations(provinces, ({many}) => ({
	districts: many(districts),
}));

export const executionDataRelations = relations(executionData, ({one, many}) => ({
	facility: one(facilities, {
		fields: [executionData.facilityId],
		references: [facilities.id]
	}),
	reportingPeriod: one(reportingPeriods, {
		fields: [executionData.reportingPeriodId],
		references: [reportingPeriods.id]
	}),
	activity: one(activities, {
		fields: [executionData.activityId],
		references: [activities.id]
	}),
	project: one(projects, {
		fields: [executionData.projectId],
		references: [projects.id]
	}),
	financialEvents: many(financialEvents),
}));

export const facilitiesRelations = relations(facilities, ({one, many}) => ({
	executionData: many(executionData),
	budgetAllocations: many(budgetAllocations),
	planningData: many(planningData),
	projects: many(projects),
	users: many(users),
	district: one(districts, {
		fields: [facilities.districtId],
		references: [districts.id]
	}),
	financialEvents: many(financialEvents),
}));

export const reportingPeriodsRelations = relations(reportingPeriods, ({many}) => ({
	executionData: many(executionData),
	budgetAllocations: many(budgetAllocations),
	planningData: many(planningData),
	projects: many(projects),
	financialEvents: many(financialEvents),
}));

export const budgetAllocationsRelations = relations(budgetAllocations, ({one, many}) => ({
	event: one(events, {
		fields: [budgetAllocations.eventId],
		references: [events.id]
	}),
	reportingPeriod: one(reportingPeriods, {
		fields: [budgetAllocations.reportingPeriodId],
		references: [reportingPeriods.id]
	}),
	facility: one(facilities, {
		fields: [budgetAllocations.facilityId],
		references: [facilities.id]
	}),
	project: one(projects, {
		fields: [budgetAllocations.projectId],
		references: [projects.id]
	}),
	planActivityBudgetMappings: many(planActivityBudgetMappings),
}));

export const accountRelations = relations(account, ({one}) => ({
	user: one(users, {
		fields: [account.userId],
		references: [users.id]
	}),
}));

export const usersRelations = relations(users, ({one, many}) => ({
	accounts: many(account),
	sessions: many(session),
	projects: many(projects),
	facility: one(facilities, {
		fields: [users.facilityId],
		references: [facilities.id]
	}),
}));

export const planActivityBudgetMappingsRelations = relations(planActivityBudgetMappings, ({one}) => ({
	budgetAllocation: one(budgetAllocations, {
		fields: [planActivityBudgetMappings.budgetAllocationId],
		references: [budgetAllocations.id]
	}),
}));

export const planningActivitiesRelations = relations(planningActivities, ({one, many}) => ({
	planningCategory: one(planningCategories, {
		fields: [planningActivities.categoryId],
		references: [planningCategories.id]
	}),
	project: one(projects, {
		fields: [planningActivities.projectId],
		references: [projects.id]
	}),
	planningData: many(planningData),
}));

export const planningCategoriesRelations = relations(planningCategories, ({one, many}) => ({
	planningActivities: many(planningActivities),
	project: one(projects, {
		fields: [planningCategories.projectId],
		references: [projects.id]
	}),
}));

export const sessionRelations = relations(session, ({one}) => ({
	user: one(users, {
		fields: [session.userId],
		references: [users.id]
	}),
}));

export const planningDataRelations = relations(planningData, ({one}) => ({
	planningActivity: one(planningActivities, {
		fields: [planningData.activityId],
		references: [planningActivities.id]
	}),
	facility: one(facilities, {
		fields: [planningData.facilityId],
		references: [facilities.id]
	}),
	reportingPeriod: one(reportingPeriods, {
		fields: [planningData.reportingPeriodId],
		references: [reportingPeriods.id]
	}),
	project: one(projects, {
		fields: [planningData.projectId],
		references: [projects.id]
	}),
}));

export const statementTemplatesRelations = relations(statementTemplates, ({one, many}) => ({
	statementTemplate: one(statementTemplates, {
		fields: [statementTemplates.parentLineId],
		references: [statementTemplates.id],
		relationName: "statementTemplates_parentLineId_statementTemplates_id"
	}),
	statementTemplates: many(statementTemplates, {
		relationName: "statementTemplates_parentLineId_statementTemplates_id"
	}),
}));

export const financialEventsRelations = relations(financialEvents, ({one}) => ({
	executionDatum: one(executionData, {
		fields: [financialEvents.sourceId],
		references: [executionData.id]
	}),
	project: one(projects, {
		fields: [financialEvents.projectId],
		references: [projects.id]
	}),
	event: one(events, {
		fields: [financialEvents.eventId],
		references: [events.id]
	}),
	reportingPeriod: one(reportingPeriods, {
		fields: [financialEvents.reportingPeriodId],
		references: [reportingPeriods.id]
	}),
	facility: one(facilities, {
		fields: [financialEvents.facilityId],
		references: [facilities.id]
	}),
}));