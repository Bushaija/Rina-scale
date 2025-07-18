import { createRoute, z } from "@hono/zod-openapi";
import { jsonContent } from "stoker/openapi/helpers";
import * as HttpStatusCodes from "stoker/http-status-codes";
import {
  DeleteExecutionDataParamsSchema,
  DeleteExecutionDataBodySchema,
  RecentActivityParamsSchema,
  RecentActivityItemSchema,
  BulkUpsertBodySchema,
  BulkUpsertResponseSchema,
  ErrorResponseSchema,
} from "./utilities.types";

const tags = ["utilities"];

// DELETE /utilities/execution-data/{id}
export const deleteExecutionData = createRoute({
  method: "delete",
  path: "/utilities/execution-data/{id}",
  request: {
    params: DeleteExecutionDataParamsSchema,
    body: {
      content: {
        "application/json": {
          schema: DeleteExecutionDataBodySchema,
        },
      },
    },
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({ id: z.number().int() }),
      "Execution data deleted successfully"
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      ErrorResponseSchema,
      "Execution data not found or user not authorized"
    ),
  },
  tags,
});

// GET /utilities/recent-activity/{userId}
export const getRecentActivity = createRoute({
  method: "get",
  path: "/utilities/recent-activity/{userId}",
  request: {
    params: RecentActivityParamsSchema,
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({ data: z.array(RecentActivityItemSchema) }),
      "Recent user activity"
    ),
  },
  tags,
});

// POST /utilities/execution-data/bulk-upsert
export const bulkUpsertExecutionData = createRoute({
  method: "post",
  path: "/utilities/execution-data/bulk-upsert",
  request: {
    body: {
      content: {
        "application/json": {
          schema: BulkUpsertBodySchema,
        },
      },
    },
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({ data: z.array(BulkUpsertResponseSchema) }),
      "Bulk upsert completed"
    ),
  },
  tags,
});

export type DeleteExecutionDataRoute = typeof deleteExecutionData;
export type GetRecentActivityRoute = typeof getRecentActivity;
export type BulkUpsertExecutionDataRoute = typeof bulkUpsertExecutionData;
