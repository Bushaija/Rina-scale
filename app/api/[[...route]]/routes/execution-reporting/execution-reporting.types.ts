import { z } from "zod";

export const ReportingPeriodParamSchema = z.object({
  reportingPeriodId: z.string().regex(/^\d+$/).transform(Number),
});

export const UserAndPeriodParamsSchema = z.object({
  userId: z.string(),
  reportingPeriodId: z.string().regex(/^\d+$/).transform(Number),
});

export const ComprehensiveReportItemSchema = z.object({
  id: z.number().int(),
  q1Amount: z.string().nullable(),
  q2Amount: z.string().nullable(),
  q3Amount: z.string().nullable(),
  q4Amount: z.string().nullable(),
  cumulativeBalance: z.string().nullable(),
  comment: z.string().nullable(),
  categoryCode: z.string(),
  categoryName: z.string(),
  categoryOrder: z.number().int(),
  subCategoryCode: z.string().nullable(),
  subCategoryName: z.string().nullable(),
  subCategoryOrder: z.number().int().nullable(),
  activityName: z.string(),
  activityOrder: z.number().int(),
  isTotalRow: z.boolean().nullable(),
});

export const CategorySummaryItemSchema = z.object({
  categoryCode: z.string(),
  categoryName: z.string(),
  totalActivities: z.number().int(),
  totalQ1: z.string().nullable(),
  totalQ2: z.string().nullable(),
  totalQ3: z.string().nullable(),
  totalQ4: z.string().nullable(),
  totalCumulative: z.string().nullable(),
});

export const UserExecutionDataItemSchema = z.object({
  id: z.number().int(),
  q1Amount: z.string().nullable(),
  q2Amount: z.string().nullable(),
  q3Amount: z.string().nullable(),
  q4Amount: z.string().nullable(),
  cumulativeBalance: z.string().nullable(),
  comment: z.string().nullable(),
  activityName: z.string(),
  categoryName: z.string(),
  subCategoryName: z.string().nullable(),
});

export const ErrorResponseSchema = z.object({
  error: z.string(),
  message: z.string(),
});
