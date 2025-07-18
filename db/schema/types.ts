import { pgEnum } from "drizzle-orm/pg-core";
import { z } from "@hono/zod-openapi";

// Enums
export const facilityTypeEnum = pgEnum('facility_type', ['hospital', 'health_center']);
export const userRoleEnum = pgEnum('user_role', ['accountant', 'admin']);





// Plan Activities
export const insertPlanActivitySchema = z.object({
	facilityId: z.number().int(),
	fiscalYear: z.string(),
	project: z.string().optional(),
	activityCategory: z.string(),
	typeOfActivity: z.string(),
	activityDescription: z.string().nullable().optional(),
	frequency: z.string(),
	unitCost: z.string(),
	countQ1: z.number().int().nullable().optional(),
	countQ2: z.number().int().nullable().optional(),
	countQ3: z.number().int().nullable().optional(),
	countQ4: z.number().int().nullable().optional(),
	comment: z.string().nullable().optional(),
	createdByUserId: z.number().int().nullable().optional(),
	lastModifiedByUserId: z.number().int().nullable().optional(),
});
export const selectPlanActivitySchema = z.object({
	id: z.number().int(),
	facilityId: z.number().int(),
	fiscalYear: z.string(),
	project: z.string(),
	planLastModified: z.string(),
	activityCategory: z.string(),
	typeOfActivity: z.string(),
	activityDescription: z.string().nullable(),
	frequency: z.string(),
	unitCost: z.string(),
	countQ1: z.number().int().nullable(),
	countQ2: z.number().int().nullable(),
	countQ3: z.number().int().nullable(),
	countQ4: z.number().int().nullable(),
	amountQ1: z.string().nullable(),
	amountQ2: z.string().nullable(),
	amountQ3: z.string().nullable(),
	amountQ4: z.string().nullable(),
	totalBudget: z.string().nullable(),
	comment: z.string().nullable(),
	createdByUserId: z.number().int().nullable(),
	lastModifiedByUserId: z.number().int().nullable(),
});
export const patchPlanActivitySchema = insertPlanActivitySchema.partial();

// Facilities
export const insertFacilitySchema = z.object({
	name: z.string(),
	facilityType: z.enum(['hospital', 'health_center']),
	districtId: z.number().int(),
});
export const selectFacilitySchema = z.object({
	id: z.number().int(),
	name: z.string(),
	facilityType: z.enum(['hospital', 'health_center']),
	districtId: z.number().int(),
});
export const patchFacilitySchema = insertFacilitySchema.partial();

// Users
export const insertUserSchema = z.object({
	name: z.string(),
	email: z.string().email(),
	passwordHash: z.string(),
	role: z.enum(['accountant', 'admin']).optional(),
	facilityId: z.number().int().nullable().optional(),
});
export const selectUserSchema = z.object({
	id: z.number().int(),
	name: z.string(),
	email: z.string().email(),
	passwordHash: z.string(),
	role: z.enum(['accountant', 'admin']),
	facilityId: z.number().int().nullable(),
	createdAt: z.string(),
	updatedAt: z.string(),
});
export const patchUserSchema = insertUserSchema.partial();

// Execution Reports
export const insertExecutionReportSchema = z.object({
	facilityId: z.number().int(),
	fiscalYear: z.string(),
	reportingPeriod: z.string(),
	project: z.string(),
	activityCategory: z.string(),
	typeOfActivity: z.string(),
	activityDescription: z.string().nullable().optional(),
	q1Amount: z.string().nullable().optional(),
	q2Amount: z.string().nullable().optional(),
	q3Amount: z.string().nullable().optional(),
	q4Amount: z.string().nullable().optional(),
	cumulativeBalance: z.string().nullable().optional(),
	comments: z.string().nullable().optional(),
	createdByUserId: z.number().int().nullable().optional(),
	lastModifiedByUserId: z.number().int().nullable().optional(),
});
export const selectExecutionReportSchema = z.object({
	id: z.number().int(),
	facilityId: z.number().int(),
	fiscalYear: z.string(),
	reportingPeriod: z.string(),
	project: z.string(),
	reportLastModified: z.string(),
	activityCategory: z.string(),
	typeOfActivity: z.string(),
	activityDescription: z.string().nullable(),
	q1Amount: z.string().nullable(),
	q2Amount: z.string().nullable(),
	q3Amount: z.string().nullable(),
	q4Amount: z.string().nullable(),
	cumulativeBalance: z.string().nullable(),
	comments: z.string().nullable(),
	createdByUserId: z.number().int().nullable(),
	lastModifiedByUserId: z.number().int().nullable(),
});

export const patchExecutionReportSchema = insertExecutionReportSchema.partial();
