import { z } from "zod";

export const PlanningActivitySchema = z.object({
    id: z.number().int(),
    name: z.string(),
    displayOrder: z.number().int(),
    isTotalRow: z.boolean().nullable(),
    categoryId: z.number().int().nullable(),
    projectId: z.number().int(),
});

export const PlanningActivitySelectSchema = PlanningActivitySchema.extend({
    categoryCode: z.string().nullable(),
    categoryName: z.string().nullable(),
    projectName: z.string().nullable(),
});

// Schema for planning data with activity details (used by facility-specific endpoint)
export const PlanningDataWithActivitySchema = z.object({
    // Planning Data fields
    planningDataId: z.number().int(),
    facilityId: z.number().int(),
    frequency: z.string().nullable(),
    unitCost: z.string().nullable(),
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
    // Planning Activity fields
    activityId: z.number().int(),
    activityName: z.string(),
    displayOrder: z.number().int(),
    isTotalRow: z.boolean().nullable(),
    facilityType: z.string(),
    // Category fields
    categoryId: z.number().int().nullable(),
    categoryCode: z.string().nullable(),
    categoryName: z.string().nullable(),
    categoryDisplayOrder: z.number().int().nullable(),
    // Project fields
    projectId: z.number().int().nullable(),
    projectName: z.string().nullable(),
});