import { createRoute, z } from "@hono/zod-openapi";
import { jsonContent } from "stoker/openapi/helpers";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { IdParamsSchema } from "stoker/openapi/schemas";
import {
  SubCategorySchema,
  ErrorResponseSchema,
  SubCategoryDetailSchema,
} from "./sub-categories.types";

const tags = ["sub-categories"];

// GET /sub-categories
export const listSubCategories = createRoute({
  method: "get",
  path: "/sub-categories",
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({ data: z.array(SubCategoryDetailSchema) }),
      "List of all sub-categories with category info"
    ),
  },
  tags,
});

// GET /sub-categories/{id}
export const getSubCategoryById = createRoute({
  method: "get",
  path: "/sub-categories/{id}",
  request: {
    params: IdParamsSchema,
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      SubCategoryDetailSchema,
      "A single sub-category with category info"
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      ErrorResponseSchema,
      "Sub-category not found"
    ),
  },
  tags,
});

// GET /sub-categories/by-category/{id}
export const listSubCategoriesByCategory = createRoute({
  method: "get",
  path: "/sub-categories/by-category/{id}",
  request: {
    params: IdParamsSchema,
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({ data: z.array(SubCategorySchema) }),
      "List of sub-categories for a given category"
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      ErrorResponseSchema,
      "Category not found"
    ),
  },
  tags,
});

export type ListSubCategoriesRoute = typeof listSubCategories;
export type GetSubCategoryByIdRoute = typeof getSubCategoryById;
export type ListSubCategoriesByCategoryRoute = typeof listSubCategoriesByCategory;
