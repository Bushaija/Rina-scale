import { createRoute } from "@hono/zod-openapi";
import { jsonContent } from "stoker/openapi/helpers";
import * as HttpStatusCodes from "stoker/http-status-codes";
import {
  ReportQuerySchema,
  VarianceAnalysisQuerySchema,
  FacilityComparisonQuerySchema,
  FinancialReportSchema,
  VarianceAnalysisResponseSchema,
  FacilityComparisonResponseSchema,
  ErrorResponseSchema,
} from "./reports.types";

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

export const financialSummary = createRoute({
  method: "get",
  path: "reports/financial-summary",
  request: {
    query: ReportQuerySchema,
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      FinancialReportSchema,
      "Financial summary report with hierarchical breakdown"
    ),
    [HttpStatusCodes.BAD_REQUEST]: jsonContent(
      ErrorResponseSchema,
      "Bad request"
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      ErrorResponseSchema,
      "Resource not found"
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      ErrorResponseSchema,
      "Internal server error"
    ),
  },
  tags: ["reports"],
  summary: "Generate financial summary report",
  description:
    "Generate a comprehensive financial report with category/subcategory breakdown",
});

export const varianceAnalysis = createRoute({
  method: "get",
  path: "/reports/variance-analysis",
  request: {
    query: VarianceAnalysisQuerySchema,
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      VarianceAnalysisResponseSchema,
      "Budget vs actual variance analysis"
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      ErrorResponseSchema,
      "Internal server error"
    ),
  },
  tags: ["reports"],
  summary: "Budget vs Actual variance analysis",
});

export const facilityComparison = createRoute({
  method: "get",
  path: "/reports/facility-comparison",
  request: {
    query: FacilityComparisonQuerySchema,
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      FacilityComparisonResponseSchema,
      "Facility performance comparison"
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      ErrorResponseSchema,
      "Internal server error"
    ),
  },
  tags: ["reports"],
  summary: "Compare facility performance",
});

export type FinancialSummaryRoute = typeof financialSummary;
export type VarianceAnalysisRoute = typeof varianceAnalysis;
export type FacilityComparisonRoute = typeof facilityComparison;
