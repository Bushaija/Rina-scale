import { createRoute, z } from "@hono/zod-openapi";
import { jsonContent } from "stoker/openapi/helpers";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { ExecutionDataListResponseSchema, ExecutionDataQuerySchema, ExecutionDataResponseSchema, ErrorResponseSchema, CreateExecutionDataSchema, UpdateExecutionDataSchema, ExecutionDataByPeriodActivityQuerySchema, ExecutionDataExistsResponseSchema, ExecutionDataSimpleResponseSchema } from "./execution-data.schema";

// GET /execution-data - List execution data with filtering
export const list = createRoute({
    method: "get",
    path: "/execution-data",
    request: {
      query: ExecutionDataQuerySchema,
    },
    responses: {
      [HttpStatusCodes.OK]: jsonContent(
        ExecutionDataListResponseSchema,
        "List of execution data entries with pagination"
      ),
    },
    tags: ["execution-data"],
    summary: "List execution data",
    description: "Retrieve execution data with optional filtering by reporting period, facility, or category",
});

// GET /execution-data/by-period-activity - Retrieve single record by period and activity
export const getByPeriodAndActivity = createRoute({
    method: "get",
    path: "/execution-data/by-period-activity",
    request: {
        query: ExecutionDataByPeriodActivityQuerySchema,
    },
    responses: {
        [HttpStatusCodes.OK]: jsonContent(
            ExecutionDataSimpleResponseSchema,
            "Execution data entry for a specific period, activity, and project"
        ),
        [HttpStatusCodes.NOT_FOUND]: jsonContent(
            ErrorResponseSchema,
            "Execution data not found"
        ),
    },
    tags: ["execution-data"],
    summary: "Get execution data by reporting period, activity, and project",
});

// GET /execution-data/exists - Check if execution data exists
export const checkExists = createRoute({
    method: "get",
    path: "/execution-data/exists",
    request: {
        query: ExecutionDataByPeriodActivityQuerySchema,
    },
    responses: {
        [HttpStatusCodes.OK]: jsonContent(
            ExecutionDataExistsResponseSchema,
            "Execution data existence status"
        ),
    },
    tags: ["execution-data"],
    summary: "Check if execution data exists for a reporting period, activity, and project",
});

// GET /execution-data/:id - Retrieve single record
export const getOne = createRoute({
  method: "get",
  path: "/execution-data/{id}",
  request: {
    params: z.object({
      id: z.string().regex(/^\d+$/).transform(Number),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: ExecutionDataResponseSchema,
        },
      },
      description: "Execution data entry details",
    },
    404: {
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
      description: "Execution data not found",
    },
    500: {
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
      description: "Internal server error",
    },
  },
  tags: ["execution-data"],
  summary: "Get execution data by ID",
});

// POST /execution-data - Create a new record
export const create = createRoute({
  method: "post",
  path: "/execution-data",
  request: {
    body: {
      content: {
        "application/json": {
          schema: CreateExecutionDataSchema,
        },
      },
    },
  },
  responses: {
    201: {
      content: {
        "application/json": {
          schema: ExecutionDataResponseSchema,
        },
      },
      description: "Execution data created successfully",
    },
    400: {
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
      description: "Invalid input data",
    },
    409: {
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
      description: "Execution data already exists for this period/activity/facility/project combination",
    },
    500: {
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
      description: "Internal server error",
    },
  },
  tags: ["execution-data"],
  summary: "Create execution data",
});

// PUT /execution-data/:id - Update existing record
export const update = createRoute({
  method: "patch",
  path: "/execution-data/{id}",
  request: {
    params: z.object({
      id: z.string().regex(/^\d+$/).transform(Number),
    }),
    body: {
      content: {
        "application/json": {
          schema: UpdateExecutionDataSchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: ExecutionDataResponseSchema,
        },
      },
      description: "Execution data updated successfully",
    },
    404: {
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
      description: "Execution data not found",
    },
    400: {
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
      description: "Invalid input data",
    },
    409: {
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
      description: "Execution data already exists for this period/activity/facility/project combination",
    },
    500: {
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
      description: "Internal server error",
    },
  },
  tags: ["execution-data"],
  summary: "Update execution data",
});

// DELETE /execution-data/:id - Delete a record
export const remove = createRoute({
  method: "delete",
  path: "/execution-data/{id}",
  request: {
    params: z.object({
      id: z.string().regex(/^\d+$/).transform(Number),
    }),
  },
  responses: {
    204: {
      description: "Execution data deleted successfully",
    },
    404: {
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
      description: "Execution data not found",
    },
  },
  tags: ["execution-data"],
  summary: "Delete execution data",
});

export type ListRoute = typeof list;
export type GetOneRoute = typeof getOne;
export type CreateRoute = typeof create;
export type UpdateRoute = typeof update;
export type RemoveRoute = typeof remove;
export type GetByPeriodAndActivityRoute = typeof getByPeriodAndActivity;
export type CheckExistsRoute = typeof checkExists;
  