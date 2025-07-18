import db from "@/db";
import * as schema from "@/db/schema";
import { asc, eq, and, isNull, or } from "drizzle-orm";

import type { AppRouteHandler } from "../../lib/types";
import type {
  ListActivitiesRoute,
  ListActivitiesByCategoryRoute,
  ListActivitiesByCategoryNoTotalsRoute,
  GetActivityByIdRoute,
} from "./activities.routes";
import * as HttpStatusCodes from "stoker/http-status-codes";

export const listActivities: AppRouteHandler<ListActivitiesRoute> = async (c) => {
  const data = await db
    .select({
      id: schema.activities.id,
      name: schema.activities.name,
      displayOrder: schema.activities.displayOrder,
      isTotalRow: schema.activities.isTotalRow,
      categoryId: schema.activities.categoryId,
      subCategoryId: schema.activities.subCategoryId,
      categoryCode: schema.categories.code,
      categoryName: schema.categories.name,
      subCategoryCode: schema.subCategories.code,
      subCategoryName: schema.subCategories.name,
    })
    .from(schema.activities)
    .leftJoin(
      schema.categories,
      eq(schema.activities.categoryId, schema.categories.id)
    )
    .leftJoin(
      schema.subCategories,
      eq(schema.activities.subCategoryId, schema.subCategories.id)
    )
    .orderBy(
      asc(schema.categories.displayOrder),
      asc(schema.subCategories.displayOrder),
      asc(schema.activities.displayOrder)
    );

  return c.json({ data }, HttpStatusCodes.OK);
};

export const listActivitiesByCategory: AppRouteHandler<
  ListActivitiesByCategoryRoute
> = async (c) => {
  const { id } = c.req.valid("param");
  const { subCategoryId } = c.req.valid("query");

  const whereConditions = [eq(schema.activities.categoryId, id)];
  if (subCategoryId) {
    whereConditions.push(eq(schema.activities.subCategoryId, subCategoryId));
  }

  const data = await db.query.activities.findMany({
    where: and(...whereConditions),
    orderBy: asc(schema.activities.displayOrder),
  });

  return c.json({ data }, HttpStatusCodes.OK);
};

export const listActivitiesByCategoryNoTotals: AppRouteHandler<
  ListActivitiesByCategoryNoTotalsRoute
> = async (c) => {
  const { id } = c.req.valid("param");

  const data = await db
    .select({
      id: schema.activities.id,
      name: schema.activities.name,
      displayOrder: schema.activities.displayOrder,
    })
    .from(schema.activities)
    .where(
      and(
        eq(schema.activities.categoryId, id),
        eq(schema.activities.isTotalRow, false)
      )
    )
    .orderBy(asc(schema.activities.displayOrder));

  return c.json({ data }, HttpStatusCodes.OK);
};

export const getActivityById: AppRouteHandler<GetActivityByIdRoute> = async (
  c
) => {
  const { id } = c.req.valid("param");
  const [data] = await db
    .select({
      id: schema.activities.id,
      name: schema.activities.name,
      displayOrder: schema.activities.displayOrder,
      isTotalRow: schema.activities.isTotalRow,
      categoryId: schema.activities.categoryId,
      subCategoryId: schema.activities.subCategoryId,
      categoryCode: schema.categories.code,
      categoryName: schema.categories.name,
      subCategoryCode: schema.subCategories.code,
      subCategoryName: schema.subCategories.name,
    })
    .from(schema.activities)
    .leftJoin(
      schema.categories,
      eq(schema.activities.categoryId, schema.categories.id)
    )
    .leftJoin(
      schema.subCategories,
      eq(schema.activities.subCategoryId, schema.subCategories.id)
    )
    .where(eq(schema.activities.id, id));

  if (!data) {
    return c.json(
      { error: "NOT_FOUND", message: "Activity not found" },
      HttpStatusCodes.NOT_FOUND
    );
  }

  return c.json(data, HttpStatusCodes.OK);
};
