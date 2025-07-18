import { createRoute, z } from "@hono/zod-openapi";
import { jsonContent } from "stoker/openapi/helpers";
import * as HttpStatusCodes from "stoker/http-status-codes";
import {
  ReportingPeriodParamSchema,
  UserAndPeriodParamsSchema,
  ComprehensiveReportItemSchema,
  CategorySummaryItemSchema,
  UserExecutionDataItemSchema,
} from "./execution-reporting.types";

const tags = ["execution-reporting"];

// GET /execution-reporting/by-period/{reportingPeriodId}
export const getComprehensiveReport = createRoute({
  method: "get",
  path: "/execution-reporting/by-period/{reportingPeriodId}",
  request: {
    params: ReportingPeriodParamSchema,
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({ data: z.array(ComprehensiveReportItemSchema) }),
      "Comprehensive execution report for a reporting period"
    ),
  },
  tags,
});

// GET /execution-reporting/summary/by-category/{reportingPeriodId}
export const getCategorySummary = createRoute({
  method: "get",
  path: "/execution-reporting/summary/by-category/{reportingPeriodId}",
  request: {
    params: ReportingPeriodParamSchema,
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({ data: z.array(CategorySummaryItemSchema) }),
      "Execution data summary grouped by category"
    ),
  },
  tags,
});

// GET /execution-reporting/by-user/{userId}/by-period/{reportingPeriodId}
export const getUserExecutionData = createRoute({
  method: "get",
  path: "/execution-reporting/by-user/{userId}/by-period/{reportingPeriodId}",
  request: {
    params: UserAndPeriodParamsSchema,
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({ data: z.array(UserExecutionDataItemSchema) }),
      "User's execution data for a specific project context"
    ),
  },
  tags,
});

export type GetComprehensiveReportRoute = typeof getComprehensiveReport;
export type GetCategorySummaryRoute = typeof getCategorySummary;
export type GetUserExecutionDataRoute = typeof getUserExecutionData;
