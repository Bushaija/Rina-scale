import { createRoute, z } from "@hono/zod-openapi";
import { jsonContent } from "stoker/openapi/helpers";
import * as HttpStatusCodes from "stoker/http-status-codes";
import {
  FacilityUpdateInfoSchema,
  FacilityIdParamSchema,
  ExecutionHierarchySchema,
  FinancialReportBodySchema,
  InsertExecutionDataResponseSchema,
  ExecutedFacilityInfoSchema,
} from "./frontend.types";

const tags = ["frontend"];

// GET /frontend/facility-update-info [+]
export const getFacilityUpdateInfo = createRoute({
  method: "get",
  path: "/frontend/facility-update-info",
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({ data: z.array(FacilityUpdateInfoSchema) }),
      "List of facilities with their last modification date"
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      z.object({ error: z.string() }),
      "User facility not found"
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      z.object({ error: z.string() }),
      "User facility not found"
    ),
  },
  tags,
});

// GET /frontend/project-execution/{facilityId}
export const getProjectExecutionData = createRoute({
  method: "get",
  path: "/frontend/project-execution/{facilityId}",
  request: {
    params: FacilityIdParamSchema,
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      ExecutionHierarchySchema,
      "Hierarchical execution data for a project"
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      z.object({ error: z.string() }),
      "User facility not found"
    ),
    [HttpStatusCodes.FORBIDDEN]: jsonContent(
      z.object({ error: z.string(), message: z.string() }),
      "Access denied - can only access assigned facility"
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      z.object({ error: z.string() }),
      "Requested facility not found"
    ),
  },
  tags,
});

// GET /frontend/executed-facilities
export const getExecutedFacilities = createRoute({
  method: "get",
  path: "/frontend/executed-facilities",
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({ data: z.array(ExecutedFacilityInfoSchema) }),
      "List of facilities that have execution data"
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      z.object({ error: z.string() }),
      "User facility not found"
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      z.object({ error: z.string() }),
      "User facility not found"
    ),
  },
  tags,
});

// POST /frontend/execution-data/{facilityId}/{reportingPeriodId}
export const postExecutionData = createRoute({
  method: "post",
  path: "/frontend/execution-data/{facilityId}/{reportingPeriodId}",
  request: {
    params: z.object({
      facilityId: z.string().regex(/^\d+$/).transform(Number),
      reportingPeriodId: z.string().regex(/^\d+$/).transform(Number),
    }),
    body: {
      content: {
        "application/json": {
          schema: FinancialReportBodySchema,
        },
      },
    },
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      InsertExecutionDataResponseSchema,
      "Insert/update counts"
    ),
  },
  tags,
});

export type GetFacilityUpdateInfoRoute = typeof getFacilityUpdateInfo;
export type GetProjectExecutionDataRoute = typeof getProjectExecutionData;
export type PostExecutionDataRoute = typeof postExecutionData;
export type GetExecutedFacilitiesRoute = typeof getExecutedFacilities;
