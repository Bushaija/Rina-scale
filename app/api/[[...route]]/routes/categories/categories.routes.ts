import { createRoute, z } from "@hono/zod-openapi";
import { jsonContent } from "stoker/openapi/helpers";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { IdParamsSchema } from "stoker/openapi/schemas";
import {
  CategorySchema,
  CategoryWithSubCategoryCountSchema,
  ErrorResponseSchema,
} from "./categories.types";

const tags = ["categories"];

// GET /categories
export const listCategories = createRoute({
  method: "get",
  path: "/categories",
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({ data: z.array(CategorySchema) }),
      "List of categories"
    ),
  },
  tags,
});

// GET /categories/{id}
export const getCategoryById = createRoute({
  method: "get",
  path: "/categories/{id}",
  request: {
    params: IdParamsSchema,
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(CategorySchema, "A single category"),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      ErrorResponseSchema,
      "Category not found"
    ),
  },
  tags,
});

// GET /categories/with-sub-category-count
export const listCategoriesWithSubCategoryCount = createRoute({
  method: "get",
  path: "/categories/with-sub-category-count",
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({ data: z.array(CategoryWithSubCategoryCountSchema) }),
      "List of categories with sub-category count"
    ),
  },
  tags,
});

export type ListCategoriesRoute = typeof listCategories;
export type GetCategoryByIdRoute = typeof getCategoryById;
export type ListCategoriesWithSubCategoryCountRoute = typeof listCategoriesWithSubCategoryCount;
