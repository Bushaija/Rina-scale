import { z } from "zod";

export const UserIdParamSchema = z.object({
  userId: z.string(),
});

export const ReportingPeriodParamSchema = z.object({
  reportingPeriodId: z.string().regex(/^\d+$/).transform(Number),
});

export const UserProgressSchema = z.object({
  year: z.number().int(),
  periodType: z.string().nullable(),
  completedActivities: z.number().int(),
  categoriesWithData: z.number().int(),
  totalCategories: z.number().int(),
});

export const QuarterlyTotalSchema = z.object({
  quarter: z.string(),
  totalAmount: z.string(),
});

export const ErrorResponseSchema = z.object({
  error: z.string(),
  message: z.string(),
});
