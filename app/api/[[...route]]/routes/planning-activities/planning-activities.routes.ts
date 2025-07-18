import { createRoute, z } from "@hono/zod-openapi";
import { jsonContent } from "stoker/openapi/helpers";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { PlanningActivitySelectSchema, PlanningDataWithActivitySchema } from "./planning-activities.types";

const tags = ["planning-activities"];

const FacilityIdParamSchema = z.object({
    facilityId: z.string().regex(/^\d+$/, "Facility ID must be a valid number").transform(Number),
});

// Schema for filtering planning activities by program and reporting period
const PlanningActivitiesFilterSchema = z.object({
    program: z.string().optional(),
    reportingPeriod: z.string().regex(/^\d+$/, "Reporting period must be a valid number").transform(Number).optional(),
    projectCode: z.string().optional(), // Alternative to program for backward compatibility
});

// Schema for planning totals response
const PlanningTotalsSchema = z.object({
    facilityId: z.number(),
    q1Total: z.number(),
    q2Total: z.number(), 
    q3Total: z.number(),
    q4Total: z.number(),
    grandTotal: z.number(),
    recordCount: z.number()
});

export const listPlanningActivities = createRoute({
    method: "get",
    path: "/planning-activities",
    responses: {
        [HttpStatusCodes.OK]: jsonContent(
            z.object({ data: z.array(PlanningActivitySelectSchema as unknown as z.ZodTypeAny) }) as unknown as z.ZodTypeAny,
            "List of all activities with hierarchy"
        ),
    },
    tags,
});

export const getPlanningActivitiesByFacilityId = createRoute({
    method: "get",
    path: "/planning-activities/by-facility/{facilityId}",
    request: {
        params: FacilityIdParamSchema,
        query: PlanningActivitiesFilterSchema,
    },
    responses: {
        [HttpStatusCodes.OK]: jsonContent(
            z.object({ data: z.array(PlanningDataWithActivitySchema as unknown as z.ZodTypeAny) }) as unknown as z.ZodTypeAny,
            "List of planning data with activity details for a specific facility"
        ),
        [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
            z.object({ error: z.string() }),
            "User facility not found"
        ),
        [HttpStatusCodes.FORBIDDEN]: jsonContent(
            z.object({ error: z.string(), message: z.string() }),
            "Access denied - can only access assigned facility"
        ),
        [HttpStatusCodes.BAD_REQUEST]: jsonContent(
            z.object({ message: z.string() }),
            "Bad request - missing or invalid facility ID"
        ),
        [HttpStatusCodes.NOT_FOUND]: jsonContent(
            z.object({ message: z.string() }),
            "No planning activities found for this facility"
        ),
        [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
            z.object({ message: z.string() }),
            "Internal server error"
        ),
    },
    tags,
});

export const getPlanningTotalsByFacilityId = createRoute({
    method: "get",
    path: "/planning-activities/totals/{facilityId}",
    request: {
        params: FacilityIdParamSchema,
    },
    responses: {
        [HttpStatusCodes.OK]: jsonContent(
            PlanningTotalsSchema,
            "Planning quarterly totals for a specific facility"
        ),
        [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
            z.object({ error: z.string() }),
            "User facility not found"
        ),
        [HttpStatusCodes.FORBIDDEN]: jsonContent(
            z.object({ error: z.string(), message: z.string() }),
            "Access denied - can only access assigned facility"
        ),
        [HttpStatusCodes.BAD_REQUEST]: jsonContent(
            z.object({ message: z.string() }),
            "Bad request - missing or invalid facility ID"
        ),
        [HttpStatusCodes.NOT_FOUND]: jsonContent(
            z.object({ message: z.string() }),
            "No planning data found for this facility"
        ),
        [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
            z.object({ message: z.string() }),
            "Internal server error"
        ),
    },
    tags,
});

export type ListPlanningActivitiesRoute = typeof listPlanningActivities;
export type GetPlanningActivitiesByFacilityIdRoute = typeof getPlanningActivitiesByFacilityId;
export type GetPlanningTotalsByFacilityIdRoute = typeof getPlanningTotalsByFacilityId;
