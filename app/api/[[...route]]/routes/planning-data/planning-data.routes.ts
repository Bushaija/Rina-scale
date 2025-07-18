import { createRoute, z } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContent } from "stoker/openapi/helpers";
import { CreatePlanningDataSchema, PlanningDataByFacilityProjectPeriodQuerySchema, UpdatePlanningDataSchema } from "./planning-data.schema";

const tags = ["planning-data"];

export const checkExists = createRoute({
    method: "get",
    path: "/planning-data/exists",
    request: {
        query: PlanningDataByFacilityProjectPeriodQuerySchema,
    },
    tags,
    summary: "Check if planning data exists for a reporting period and activity",
    responses: {
        [HttpStatusCodes.OK]: jsonContent(
            z.object({ exists: z.boolean() }),
            "Planning data existence status"
        ),
    },
});

export const create = createRoute({
    method: "post",
    path: "/planning-data",
    tags,
    request: {
        body: {
            content: {
                "application/json": {
                    schema: CreatePlanningDataSchema,
                },
            },
        },
    },
    responses: {
        [HttpStatusCodes.CREATED]: jsonContent(
            z.object({ id: z.number() }),
            "Planning data created successfully"
        ),
        [HttpStatusCodes.BAD_REQUEST]: jsonContent(
            z.object({ error: z.string() }),
            "Invalid input data"
        ),
        [HttpStatusCodes.CONFLICT]: jsonContent(
            z.object({ error: z.string() }),
            "Planning data already exists for this period/activity/facility combination"
        ),
        [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
            z.object({ error: z.string() }),
            "Internal server error"
        ),
    },
    summary: "Create planning data",
});

export const update = createRoute({
    method: "patch",
    path: "/planning-data/{id}",
    tags,
    request: {
        params: z.object({
            id: z.string().regex(/^\d+$/).transform(Number),
        }),
        body: {
            content: {
                "application/json": {
                    schema: UpdatePlanningDataSchema,
                },
            },
        },
    },
    responses: {
        [HttpStatusCodes.OK]: jsonContent(
            z.object({ id: z.number() }),
            "Planning data updated successfully"
        ),
        [HttpStatusCodes.NOT_FOUND]: jsonContent(
            z.object({ error: z.string() }),
            "Planning data not found"
        ),
        [HttpStatusCodes.BAD_REQUEST]: jsonContent(
            z.object({ error: z.string() }),
            "Invalid input data"
        ),
        [HttpStatusCodes.CONFLICT]: jsonContent(
            z.object({ error: z.string() }),
            "Planning data already exists for this period/activity/facility combination"
        ),
        [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
            z.object({ error: z.string() }),
            "Internal server error"
        ),
    },
    summary: "Update planning data",
});

export type CreateRoute = typeof create;
export type UpdateRoute = typeof update;
export type CheckExistsRoute = typeof checkExists;