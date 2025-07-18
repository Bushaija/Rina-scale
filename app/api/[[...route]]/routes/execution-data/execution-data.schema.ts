import { z } from "zod";

const amountRegex = /^-?\d+(\.\d{1,2})?$/;   // allow optional leading "-"

// Request Schemas
export const CreateExecutionDataSchema = z.object({
    reportingPeriodId: z.number().int().positive(),
    activityId: z.number().int().positive(),
    facilityId: z.number().int().positive(),
    projectId: z.number().int().positive(),
    q1Amount: z.string().regex(amountRegex).optional(),
    q2Amount: z.string().regex(amountRegex).optional(),
    q3Amount: z.string().regex(amountRegex).optional(),
    q4Amount: z.string().regex(amountRegex).optional(),
    comment: z.string().max(1000).optional(),
  });
  
export const UpdateExecutionDataSchema = CreateExecutionDataSchema.partial();
  
export const ExecutionDataQuerySchema = z.object({
    reportingPeriodId: z.string().optional(),
    facilityId: z.string().optional(),
    categoryId: z.string().optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
    offset: z.string().regex(/^\d+$/).transform(Number).optional(),
  });
  
export const ExecutionDataByPeriodActivityQuerySchema = z.object({
  reportingPeriodId: z.string().regex(/^\d+$/).transform(Number),
  activityId: z.string().regex(/^\d+$/).transform(Number),
  facilityId: z.string().regex(/^\d+$/).transform(Number),
  projectId: z.string().regex(/^\d+$/).transform(Number),
});
  
  // Response Schemas
export const ExecutionDataResponseSchema = z.object({
    id: z.number().int(),
    reportingPeriodId: z.number().int().nullable(),
    activityId: z.number().int().nullable(),
    projectId: z.number().int().nullable(),
    q1Amount: z.string().nullable(),
    q2Amount: z.string().nullable(),
    q3Amount: z.string().nullable(),
    q4Amount: z.string().nullable(),
    cumulativeBalance: z.string().nullable(),
    comment: z.string().nullable(),
    facilityId: z.number().int().nullable(),
    createdAt: z.string().nullable(),
    updatedAt: z.string().nullable(),
    createdBy: z.string().nullable(),
    updatedBy: z.string().nullable(),
    // Joined data
    activity: z.object({
      id: z.number().int(),
      name: z.string(),
      isTotalRow: z.boolean(),
      category: z.object({
        id: z.number().int(),
        code: z.string(),
        name: z.string(),
      }),
      subCategory: z.object({
        id: z.number().int(),
        code: z.string(),
        name: z.string(),
      }).nullable(),
    }).nullable(),
    reportingPeriod: z.object({
      id: z.number().int(),
      year: z.number().int(),
      periodType: z.string(),
      startDate: z.string(),
      endDate: z.string(),
    }).nullable(),
  });
  
export const ExecutionDataListResponseSchema = z.object({
    data: z.array(ExecutionDataResponseSchema),
    pagination: z.object({
      total: z.number().int(),
      limit: z.number().int(),
      offset: z.number().int(),
      hasNext: z.boolean(),
    }),
  });
  
export const ExecutionDataSimpleResponseSchema = z.object({
  id: z.number().int(),
  facilityId: z.number().int().nullable(),
  q1Amount: z.string().nullable(),
  q2Amount: z.string().nullable(),
  q3Amount: z.string().nullable(),
  q4Amount: z.string().nullable(),
  cumulativeBalance: z.string().nullable(),
  comment: z.string().nullable(),
  createdAt: z.string().nullable(),
  updatedAt: z.string().nullable(),
});

export const ExecutionDataExistsResponseSchema = z.object({
  exists: z.boolean(),
  id: z.number().int().nullable(),
});
  
  // ========================================
  // 5. Error Handling Schemas
  // ========================================
export const ErrorResponseSchema = z.object({
    error: z.string(),
    message: z.string(),
    details: z.any().optional(),
  });
  
  // ========================================
  // Helper to map DB result to schema shape
  // ========================================
export const mapExecutionData = (item: any) => {
  if (!item) return item;
  
  return {
    id: item.id,
    reportingPeriodId: item.reportingPeriodId,
    activityId: item.activityId,
    projectId: item.projectId,
    q1Amount: item.q1Amount,
    q2Amount: item.q2Amount,
    q3Amount: item.q3Amount,
    q4Amount: item.q4Amount,
    cumulativeBalance: item.cumulativeBalance,
    comment: item.comment,
    facilityId: item.facilityId,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    createdBy: item.createdBy,
    updatedBy: item.updatedBy,
    activity: item.activity ? {
      id: item.activity.id,
      name: item.activity.name,
      isTotalRow: item.activity.isTotalRow ?? false,
      category: item.activity.category ? {
        id: item.activity.category.id,
        code: item.activity.category.code,
        name: item.activity.category.name,
      } : { id: 0, code: "", name: "" },
      subCategory: item.activity.subCategory ? {
        id: item.activity.subCategory.id,
        code: item.activity.subCategory.code,
        name: item.activity.subCategory.name,
      } : null,
    } : null,
    reportingPeriod: item.reportingPeriod ? {
      id: item.reportingPeriod.id,
      year: item.reportingPeriod.year,
      periodType: item.reportingPeriod.periodType ?? "",
      startDate: item.reportingPeriod.startDate,
      endDate: item.reportingPeriod.endDate,
    } : null,
  };
};
