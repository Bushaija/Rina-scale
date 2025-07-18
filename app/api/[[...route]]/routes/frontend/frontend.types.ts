import { z } from "zod";

export const FacilityUpdateInfoSchema = z.object({
  id: z.number().int(),
  facilityName: z.string(),
  facilityType: z.enum(["hospital", "health_center"]), // More specific typing based on your schema
  districtName: z.string(),
  dateModified: z.string().datetime().nullable(), // Better validation for datetime strings
  projectCode: z.string(),
});

export const FacilityIdParamSchema = z.object({
  facilityId: z.string().regex(/^\d+$/).transform(Number),
});

export const ExecutionHierarchySchema = z.object({
  tableData: z.array(z.any()),
});

export const ErrorResponseSchema = z.object({
  error: z.string(),
  message: z.string(),
});

// POST body: full financial report (allow any valid JSON for now)
export const FinancialReportBodySchema = z.any();

export const InsertExecutionDataResponseSchema = z.object({
  inserted: z.number().int(),
  updated: z.number().int(),
});

export const ExecutedFacilityInfoSchema = z.object({
  id: z.number(),
  name: z.string(),
  facilityType: z.enum(["hospital", "health_center"]),
  districtName: z.string().nullable(),
  executionRows: z.number(),
  totalExecutedAmount: z.string().nullable().transform(v => v ? parseFloat(v) : null),
  lastExecutedAt: z.date().nullable(),
  projectCode: z.string(),
});
