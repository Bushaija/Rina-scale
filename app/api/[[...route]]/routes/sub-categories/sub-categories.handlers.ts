import db from "@/db";
import * as schema from "@/db/schema";
import { asc, eq } from "drizzle-orm";

import type { AppRouteHandler } from "../../lib/types";
import type {
  ListSubCategoriesRoute,
  ListSubCategoriesByCategoryRoute,
  GetSubCategoryByIdRoute,
} from "./sub-categories.routes";
import * as HttpStatusCodes from "stoker/http-status-codes";

export const listSubCategories: AppRouteHandler<ListSubCategoriesRoute> = async (
  c
) => {
  const data = await db
    .select({
      id: schema.subCategories.id,
      code: schema.subCategories.code,
      name: schema.subCategories.name,
      displayOrder: schema.subCategories.displayOrder,
      categoryId: schema.subCategories.categoryId,
      categoryCode: schema.categories.code,
      categoryName: schema.categories.name,
    })
    .from(schema.subCategories)
    .leftJoin(
      schema.categories,
      eq(schema.subCategories.categoryId, schema.categories.id)
    )
    .orderBy(
      asc(schema.categories.displayOrder),
      asc(schema.subCategories.displayOrder)
    );

  return c.json({ data }, HttpStatusCodes.OK);
};

export const getSubCategoryById: AppRouteHandler<GetSubCategoryByIdRoute> = async (
  c
) => {
  const { id } = c.req.valid("param");
  const [data] = await db
    .select({
      id: schema.subCategories.id,
      code: schema.subCategories.code,
      name: schema.subCategories.name,
      displayOrder: schema.subCategories.displayOrder,
      categoryId: schema.subCategories.categoryId,
      categoryCode: schema.categories.code,
      categoryName: schema.categories.name,
    })
    .from(schema.subCategories)
    .leftJoin(
      schema.categories,
      eq(schema.subCategories.categoryId, schema.categories.id)
    )
    .where(eq(schema.subCategories.id, id));

  if (!data) {
    return c.json(
      { error: "NOT_FOUND", message: "Sub-category not found" },
      HttpStatusCodes.NOT_FOUND
    );
  }

  return c.json(data, HttpStatusCodes.OK);
};

export const listSubCategoriesByCategory: AppRouteHandler<
  ListSubCategoriesByCategoryRoute
> = async (c) => {
  const { id } = c.req.valid("param");
  const data = await db.query.subCategories.findMany({
    where: eq(schema.subCategories.categoryId, id),
    orderBy: asc(schema.subCategories.displayOrder),
  });

  return c.json({ data }, HttpStatusCodes.OK);
};
