import { createRoute, z } from "@hono/zod-openapi";
import { jsonContent } from "stoker/openapi/helpers";
import * as HttpStatusCodes from "stoker/http-status-codes";
import {
  UserIdParamSchema,
  ReportingPeriodParamSchema,
  UserProgressSchema,
  QuarterlyTotalSchema,
  ErrorResponseSchema,
} from "./analytics.types";

const tags = ["analytics"];

// GET /analytics/progress/by-user/{userId}
export const getUserProgress = createRoute({
  method: "get",
  path: "/analytics/progress/by-user/{userId}",
  request: {
    params: UserIdParamSchema,
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({ data: z.array(UserProgressSchema) }),
      "User execution data progress"
    ),
  },
  tags,
});

// GET /analytics/quarterly-totals/{reportingPeriodId}
export const getQuarterlyTotals = createRoute({
  method: "get",
  path: "/analytics/quarterly-totals/{reportingPeriodId}",
  request: {
    params: ReportingPeriodParamSchema,
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({ data: z.array(QuarterlyTotalSchema) }),
      "Quarterly totals for a reporting period"
    ),
  },
  tags,
});

export type GetUserProgressRoute = typeof getUserProgress;
export type GetQuarterlyTotalsRoute = typeof getQuarterlyTotals;
