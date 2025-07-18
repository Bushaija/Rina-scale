import { z } from "zod";

const QuarterCountSchema = z.number().int().min(0);

// Base schema without the "at least one quarter" rule
const BasePlanningDataSchema = z.object({
    planningActivityId: z.number().int().positive(),
    facilityId: z.number().int().positive(),
    reportingPeriodId: z.number().int().positive(),
    projectId: z.number().int().positive().optional(),
    frequency: z.number().min(0).optional(),
    unitCost: z.number().min(0).optional(),
    countQ1: QuarterCountSchema,
    countQ2: QuarterCountSchema,
    countQ3: QuarterCountSchema,
    countQ4: QuarterCountSchema,
    comment: z.string().max(1000).optional(),
});

export const CreatePlanningDataSchema = BasePlanningDataSchema;

export const UpdatePlanningDataSchema = BasePlanningDataSchema.partial();

export const PlanningDataByFacilityProjectPeriodQuerySchema = z.object({
    facilityId: z.string().regex(/^\d+$/).transform(Number),
    projectId: z.string().regex(/^\d+$/).transform(Number),
    reportingPeriodId: z.string().regex(/^\d+$/).transform(Number),
});

export const mapPlanningData = (item: any) => {
    if (!item) {
        throw new Error("Cannot map null or undefined planning data");
    }
    
    return {
        id: item.id,
        activityId: item.activityId,
        facilityId: item.facilityId,
        reportingPeriodId: item.reportingPeriodId,
        projectId: item.projectId,
        frequency: item.frequency,
        unitCost: item.unitCost,
        countQ1: item.countQ1 ?? 0,
        countQ2: item.countQ2 ?? 0,
        countQ3: item.countQ3 ?? 0,
        countQ4: item.countQ4 ?? 0,
        amountQ1: item.amountQ1 ?? "0.00",
        amountQ2: item.amountQ2 ?? "0.00",
        amountQ3: item.amountQ3 ?? "0.00",
        amountQ4: item.amountQ4 ?? "0.00",
        totalBudget: item.totalBudget ?? "0.00",
        comment: item.comment ?? null,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        planningActivity: item.planningActivity ? {
            id: item.planningActivity.id,
            name: item.planningActivity.name,
            category: item.planningActivity.planningCategory ? {
                id: item.planningActivity.planningCategory.id,
                code: item.planningActivity.planningCategory.code,
                name: item.planningActivity.planningCategory.name,
            } : null,
        } : null,
        reportingPeriod: item.reportingPeriod ? {
            id: item.reportingPeriod.id,
            year: item.reportingPeriod.year,
            periodType: item.reportingPeriod.periodType ?? "",
            startDate: item.reportingPeriod.startDate,
            endDate: item.reportingPeriod.endDate,
        } : null,
        project: item.project ? {
            id: item.project.id,
            name: item.project.name,
        } : null,
    };
};