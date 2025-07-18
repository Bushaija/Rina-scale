import db from "@/db";
import * as schema from "@/db/schema";
import { asc, eq, count } from "drizzle-orm";

import type { AppRouteHandler } from "../../lib/types";
import type {
  ListCategoriesRoute,
  GetCategoryByIdRoute,
  ListCategoriesWithSubCategoryCountRoute,
} from "./categories.routes";
import * as HttpStatusCodes from "stoker/http-status-codes";

export const listCategories: AppRouteHandler<ListCategoriesRoute> = async (c) => {
  const data = await db.query.categories.findMany({
    orderBy: asc(schema.categories.displayOrder),
  });
  return c.json({ data }, HttpStatusCodes.OK);
};

export const getCategoryById: AppRouteHandler<GetCategoryByIdRoute> = async (
  c
) => {
  const { id } = c.req.valid("param");
  const data = await db.query.categories.findFirst({
    where: eq(schema.categories.id, id),
  });

  if (!data) {
    return c.json(
      {
        error: "NOT_FOUND",
        message: "Category not found",
      },
      HttpStatusCodes.NOT_FOUND
    );
  }

  return c.json(data, HttpStatusCodes.OK);
};

export const listCategoriesWithSubCategoryCount: AppRouteHandler<
  ListCategoriesWithSubCategoryCountRoute
> = async (c) => {
  const data = await db
    .select({
      id: schema.categories.id,
      code: schema.categories.code,
      name: schema.categories.name,
      displayOrder: schema.categories.displayOrder,
      subCategoryCount: count(schema.subCategories.id),
    })
    .from(schema.categories)
    .leftJoin(
      schema.subCategories,
      eq(schema.categories.id, schema.subCategories.categoryId)
    )
    .groupBy(
      schema.categories.id,
      schema.categories.code,
      schema.categories.name,
      schema.categories.displayOrder
    )
    .orderBy(asc(schema.categories.displayOrder));

  return c.json({ data }, HttpStatusCodes.OK);
};
