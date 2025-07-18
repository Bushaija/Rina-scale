import { createRoute, z } from "@hono/zod-openapi";
import { jsonContent } from "stoker/openapi/helpers";
import * as HttpStatusCodes from "stoker/http-status-codes";
import {
  CreateProjectSchema,
  ProjectQuerySchema,
  ProjectResponseSchema,
  ErrorResponseSchema,
  UserProjectsParamsSchema,
  CheckProjectExistsQuerySchema,
  ProjectExistsResponseSchema,
  UpdateProjectStatusParamsSchema,
  UpdateProjectStatusBodySchema,
  UpdateProjectStatusResponseSchema,
} from "./projects.types";

// GET /projects
export const listProjects = createRoute({
  method: "get",
  path: "/projects",
  request: {
    query: ProjectQuerySchema,
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({ data: z.array(ProjectResponseSchema) }),
      "List of projects"
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      ErrorResponseSchema,
      "Internal server error"
    ),
  },
  tags: ["projects"],
  summary: "List projects",
});

// POST /projects
export const createProject = createRoute({
  method: "post",
  path: "/projects",
  request: {
    body: {
      content: {
        "application/json": {
          schema: CreateProjectSchema,
        },
      },
    },
  },
  responses: {
    [HttpStatusCodes.CREATED]: jsonContent(
      ProjectResponseSchema,
      "Project created successfully"
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      ErrorResponseSchema,
      "Internal server error"
    ),
  },
  tags: ["projects"],
  summary: "Create project",
});

// GET /projects/by-user/{userId}
export const listUserProjects = createRoute({
  method: "get",
  path: "/projects/by-user/{userId}",
  request: {
    params: UserProjectsParamsSchema,
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({ data: z.array(ProjectResponseSchema) }),
      "List of projects for a user"
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      ErrorResponseSchema,
      "Internal server error"
    ),
  },
  tags: ["projects"],
  summary: "List a user's projects",
});

// GET /projects/exists
export const checkProjectExists = createRoute({
  method: "get",
  path: "/projects/exists",
  request: {
    query: CheckProjectExistsQuerySchema,
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      ProjectExistsResponseSchema,
      "Project existence status"
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      ErrorResponseSchema,
      "Internal server error"
    ),
  },
  tags: ["projects"],
  summary: "Check if a project exists",
});

// PATCH /projects/{id}/status
export const updateProjectStatus = createRoute({
  method: "patch",
  path: "/projects/{id}/status",
  request: {
    params: UpdateProjectStatusParamsSchema,
    body: {
      content: {
        "application/json": {
          schema: UpdateProjectStatusBodySchema,
        },
      },
    },
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      UpdateProjectStatusResponseSchema,
      "Project status updated"
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(ErrorResponseSchema, "Project not found"),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      ErrorResponseSchema,
      "Internal server error"
    ),
  },
  tags: ["projects"],
  summary: "Update a project's status",
});

// GET single /projects/{id}
export const getProject = createRoute({
  method: "get",
  path: "/projects/{id}",
  request: {
    params: UpdateProjectStatusParamsSchema, // reuse same {id}
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      ProjectResponseSchema,
      "Project detail"
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      ErrorResponseSchema,
      "Project not found"
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      ErrorResponseSchema,
      "Internal server error"
    ),
  },
  tags: ["projects"],
  summary: "Get a project by id",
});

export type ListProjectsRoute = typeof listProjects;
export type CreateProjectRoute = typeof createProject;
export type ListUserProjectsRoute = typeof listUserProjects;
export type CheckProjectExistsRoute = typeof checkProjectExists;
export type UpdateProjectStatusRoute = typeof updateProjectStatus;
export type GetProjectRoute = typeof getProject;
