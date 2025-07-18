import { createRoute, z } from "@hono/zod-openapi";
import { jsonContent } from "stoker/openapi/helpers";
import * as HttpStatusCodes from "stoker/http-status-codes";
import {
  CreateReportingPeriodSchema,
  ReportingPeriodResponseSchema,
  ErrorResponseSchema,
} from "./reporting-periods.types";


// GET /reporting-periods/:id
export const getReportingPeriodById = createRoute({
  method: "get",
  path: "/reporting-periods/{id}",
  request: {
    params: z.object({
      id: z.coerce.number().int().openapi({
        param: {
          name: "id",
          in: "path",
        },
        example: 1,
      }),
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      ReportingPeriodResponseSchema,
      "Reporting period details"
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      ErrorResponseSchema,
      "Reporting period not found"
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      ErrorResponseSchema,
      "Internal server error"
    ),
  },
  tags: ["reporting-periods"],
  summary: "Get a reporting period by ID",
});

// GET /reporting-periods/active
export const listActiveReportingPeriods = createRoute({
  method: "get",
  path: "/reporting-periods/active",
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({ data: ReportingPeriodResponseSchema }),
      "The single active reporting period"
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      ErrorResponseSchema,
      "No active reporting period found"
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      ErrorResponseSchema,
      "Internal server error"
    ),
  },
  tags: ["reporting-periods"],
  summary: "List active reporting periods",
});

// GET /reporting-periods/current
export const getCurrentReportingPeriod = createRoute({
  method: "get",
  path: "/reporting-periods/current",
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      ReportingPeriodResponseSchema,
      "Current active reporting period"
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      ErrorResponseSchema,
      "No current active reporting period found"
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      ErrorResponseSchema,
      "Internal server error"
    ),
  },
  tags: ["reporting-periods"],
  summary: "Get the current active reporting period",
});

// GET /reporting-periods
export const listReportingPeriods = createRoute({
  method: "get",
  path: "/reporting-periods",
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({ data: z.array(ReportingPeriodResponseSchema) }),
      "List of reporting periods"
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      ErrorResponseSchema,
      "Internal server error"
    ),
  },
  tags: ["reporting-periods"],
  summary: "List reporting periods",
});

// POST /reporting-periods
export const createReportingPeriod = createRoute({
  method: "post",
  path: "/reporting-periods",
  request: {
    body: {
      content: {
        "application/json": {
          schema: CreateReportingPeriodSchema,
        },
      },
    },
  },
  responses: {
    [HttpStatusCodes.CREATED]: jsonContent(
      ReportingPeriodResponseSchema,
      "Reporting period created successfully"
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      ErrorResponseSchema,
      "Internal server error"
    ),
  },
  tags: ["reporting-periods"],
  summary: "Create reporting period",
});

export type ListReportingPeriodsRoute = typeof listReportingPeriods;
export type CreateReportingPeriodRoute = typeof createReportingPeriod;
export type GetReportingPeriodByIdRoute = typeof getReportingPeriodById;
export type ListActiveReportingPeriodsRoute = typeof listActiveReportingPeriods;
export type GetCurrentReportingPeriodRoute = typeof getCurrentReportingPeriod;
