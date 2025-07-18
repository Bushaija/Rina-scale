import { z } from "zod";

// --- Schemas for Delete Execution Data ---
export const DeleteExecutionDataParamsSchema = z.object({
  id: z.string().regex(/^\d+$/).transform(Number),
});

export const DeleteExecutionDataBodySchema = z.object({
  userId: z.string(),
});

// --- Schemas for Recent User Activity ---
export const RecentActivityParamsSchema = z.object({
  userId: z.string(),
});

export const RecentActivityItemSchema = z.object({
  updatedAt: z.string().nullable(),
  activityName: z.string(),
  categoryName: z.string(),
  year: z.number().int(),
  actionType: z.string(),
});

// --- Schemas for Bulk Upsert ---
export const BulkUpsertItemSchema = z.object({
  reportingPeriodId: z.number().int().positive(),
  activityId: z.number().int().positive(),
  q1Amount: z.string().regex(/^\d+(\.\d{1,2})?$/).optional().nullable(),
  q2Amount: z.string().regex(/^\d+(\.\d{1,2})?$/).optional().nullable(),
  q3Amount: z.string().regex(/^\d+(\.\d{1,2})?$/).optional().nullable(),
  q4Amount: z.string().regex(/^\d+(\.\d{1,2})?$/).optional().nullable(),
  comment: z.string().max(1000).optional().nullable(),
  createdBy: z.string(),
});

export const BulkUpsertBodySchema = z.object({
  items: z.array(BulkUpsertItemSchema),
});

export const BulkUpsertResponseSchema = z.object({
  id: z.number().int(),
  cumulativeBalance: z.string().nullable(),
});

// --- Generic Error Schema ---
export const ErrorResponseSchema = z.object({
  error: z.string(),
  message: z.string(),
});
