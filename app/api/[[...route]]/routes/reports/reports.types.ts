import { z } from "zod";

// -----------------------------------------
// Common Query Schemas
// -----------------------------------------
export const ReportQuerySchema = z.object({
  reportingPeriodId: z.string().regex(/^\d+$/).transform(Number),
  facilityId: z.string().regex(/^\d+$/).transform(Number).optional(),
  categoryCode: z.string().optional(),
});

export const VarianceAnalysisQuerySchema = ReportQuerySchema.extend({
  budgetPeriodId: z.string().regex(/^\d+$/).transform(Number),
});

export const FacilityComparisonQuerySchema = z.object({
  reportingPeriodId: z.string().regex(/^\d+$/).transform(Number),
  facilityIds: z.string().transform((str) => str.split(',').map(Number)),
  categoryCode: z.string().optional(),
});

// -----------------------------------------
// Response Schemas
// -----------------------------------------
export const ExecutionSummarySchema = z.object({
  categoryCode: z.string(),
  categoryName: z.string(),
  subCategories: z.array(
    z.object({
      code: z.string(),
      name: z.string(),
      activities: z.array(
        z.object({
          id: z.number().int(),
          name: z.string(),
          isTotalRow: z.boolean(),
          q1Amount: z.string(),
          q2Amount: z.string(),
          q3Amount: z.string(),
          q4Amount: z.string(),
          cumulativeBalance: z.string(),
        })
      ),
    })
  ),
  directActivities: z.array(
    z.object({
      id: z.number().int(),
      name: z.string(),
      isTotalRow: z.boolean(),
      q1Amount: z.string(),
      q2Amount: z.string(),
      q3Amount: z.string(),
      q4Amount: z.string(),
      cumulativeBalance: z.string(),
    })
  ),
});

export const FinancialReportSchema = z.object({
  reportingPeriod: z.object({
    id: z.number().int(),
    year: z.number().int(),
    periodType: z.string(),
    startDate: z.string(),
    endDate: z.string(),
  }),
  facility: z
    .object({
      id: z.number().int(),
      name: z.string(),
      facilityType: z.string(),
    })
    .optional(),
  categories: z.array(ExecutionSummarySchema),
  totals: z.object({
    q1Total: z.string(),
    q2Total: z.string(),
    q3Total: z.string(),
    q4Total: z.string(),
    cumulativeTotal: z.string(),
  }),
  generatedAt: z.string(),
});

export const VarianceAnalysisResponseSchema = z.object({
  reportingPeriod: z.object({
    id: z.number().int(),
    year: z.number().int(),
    periodType: z.string(),
  }),
  analysis: z.array(
    z.object({
      activityName: z.string(),
      categoryName: z.string(),
      budgetAmount: z.string(),
      actualAmount: z.string(),
      variance: z.string(),
      variancePercentage: z.number(),
    })
  ),
});

export const FacilityComparisonResponseSchema = z.object({
  comparison: z.array(
    z.object({
      facilityName: z.string(),
      categoryBreakdown: z.array(
        z.object({
          categoryCode: z.string(),
          categoryName: z.string(),
          totalAmount: z.string(),
        })
      ),
      grandTotal: z.string(),
    })
  ),
  reportingPeriodId: z.number().int(),
  facilityIds: z.array(z.number().int()),
  categoryCode: z.string().optional(),
});

// Generic error
export const ErrorResponseSchema = z.object({
  error: z.string(),
  message: z.string(),
});
