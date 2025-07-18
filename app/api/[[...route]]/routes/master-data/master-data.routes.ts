import { createRoute, z } from "@hono/zod-openapi";
import { jsonContent } from "stoker/openapi/helpers";
import * as HttpStatusCodes from "stoker/http-status-codes";
import {
  CategoryResponseSchema,
  SubCategoryResponseSchema,
  ActivityResponseSchema,
  HierarchicalDataSchema,
  SubCategoryQuerySchema,
  ActivitiesQuerySchema,
} from "./master-data.types";

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

// GET /categories - list categories
export const getCategories = createRoute({
  method: "get",
  path: "/categories",
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({ data: z.array(CategoryResponseSchema) }),
      "List of categories"
    ),
  },
  tags: ["master-data"],
  summary: "Get all categories",
});

// GET /sub-categories - list sub categories (optionally filter by categoryId)
export const getSubCategories = createRoute({
  method: "get",
  path: "/sub-categories",
  request: {
    query: SubCategoryQuerySchema,
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({ data: z.array(SubCategoryResponseSchema) }),
      "List of sub-categories"
    ),
  },
  tags: ["master-data"],
  summary: "Get sub-categories",
});

// GET /activities - list activities with optional filters
export const getActivities = createRoute({
  method: "get",
  path: "/activities",
  request: {
    query: ActivitiesQuerySchema,
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({ data: z.array(ActivityResponseSchema) }),
      "List of activities"
    ),
  },
  tags: ["master-data"],
  summary: "Get activities",
});

// GET /hierarchical - complete hierarchical data
export const getHierarchicalData = createRoute({
  method: "get",
  path: "/hierarchical",
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      HierarchicalDataSchema,
      "Complete hierarchical structure of categories, sub-categories, and activities"
    ),
  },
  tags: ["master-data"],
  summary: "Get hierarchical master data",
  description: "Returns the complete category hierarchy for building UI forms and reports",
});

// ---------------------------------------------------------------------------
// Route Types
// ---------------------------------------------------------------------------
export type GetCategoriesRoute = typeof getCategories;
export type GetSubCategoriesRoute = typeof getSubCategories;
export type GetActivitiesRoute = typeof getActivities;
export type GetHierarchicalDataRoute = typeof getHierarchicalData;
