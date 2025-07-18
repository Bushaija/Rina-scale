import { createRoute, z } from "@hono/zod-openapi";
import { jsonContent } from "stoker/openapi/helpers";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { IdParamsSchema } from "stoker/openapi/schemas";
import {
  ActivitySchema,
  ActivityDetailSchema,
  ActivityBasicSchema,
  ActivitiesByCategoryQuerySchema,
  ErrorResponseSchema,
} from "./activities.types";

const tags = ["activities"];

// GET /activities
export const listActivities = createRoute({
  method: "get",
  path: "/activities",
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({ data: z.array(ActivityDetailSchema) }),
      "List of all activities with hierarchy"
    ),
  },
  tags,
});

// GET /activities/by-category/{id}
export const listActivitiesByCategory = createRoute({
  method: "get",
  path: "/activities/by-category/{id}",
  request: {
    params: IdParamsSchema,
    query: ActivitiesByCategoryQuerySchema,
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({ data: z.array(ActivitySchema) }),
      "List of activities for a category"
    ),
  },
  tags,
});

// GET /activities/by-category/{id}/no-totals
export const listActivitiesByCategoryNoTotals = createRoute({
  method: "get",
  path: "/activities/by-category/{id}/no-totals",
  request: {
    params: IdParamsSchema,
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({ data: z.array(ActivityBasicSchema) }),
      "List of activities for a category, excluding total rows"
    ),
  },
  tags,
});

// GET /activities/{id}
export const getActivityById = createRoute({
  method: "get",
  path: "/activities/{id}",
  request: {
    params: IdParamsSchema,
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      ActivityDetailSchema,
      "A single activity with full context"
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      ErrorResponseSchema,
      "Activity not found"
    ),
  },
  tags,
});

export type ListActivitiesRoute = typeof listActivities;
export type ListActivitiesByCategoryRoute = typeof listActivitiesByCategory;
export type ListActivitiesByCategoryNoTotalsRoute =
  typeof listActivitiesByCategoryNoTotals;
export type GetActivityByIdRoute = typeof getActivityById;
