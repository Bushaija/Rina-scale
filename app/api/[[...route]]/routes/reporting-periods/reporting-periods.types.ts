import { z } from "zod";

// ------------------------------
// Request Schemas
// ------------------------------
export const CreateReportingPeriodSchema = z.object({
  year: z.number().int().min(2020).max(2030),
  periodType: z.enum(["ANNUAL", "QUARTERLY", "MONTHLY"]).default("ANNUAL"),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  status: z.enum(["ACTIVE", "INACTIVE", "CLOSED"]).default("ACTIVE"),
});

// ------------------------------
// Response Schemas
// ------------------------------
export const ReportingPeriodResponseSchema = z.object({
  id: z.number().int(),
  year: z.number().int(),
  periodType: z.string().nullable(),
  startDate: z.string(),
  endDate: z.string(),
  status: z.string().nullable(),
  createdAt: z.string().nullable(),
  updatedAt: z.string().nullable(),
});

// Generic error response schema
export const ErrorResponseSchema = z.object({
  error: z.string(),
  message: z.string(),
});
