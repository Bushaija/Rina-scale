import db from "@/db";
import * as schema from "@/db/schema";
import { asc, eq, and, count, sum, sql } from "drizzle-orm";

import type { AppRouteHandler } from "../../lib/types";
import type {
  GetComprehensiveReportRoute,
  GetCategorySummaryRoute,
  GetUserExecutionDataRoute,
} from "./execution-reporting.routes";
import * as HttpStatusCodes from "stoker/http-status-codes";

export const getComprehensiveReport: AppRouteHandler<
  GetComprehensiveReportRoute
> = async (c) => {
  const { reportingPeriodId } = c.req.valid("param");
  const user = c.get("user");
  
  if (!user?.facilityId) {
      return c.json({ error: "User facility not found" }, HttpStatusCodes.UNAUTHORIZED);
  }

  // Get the user's facility to determine their district
  const userFacility = await db.query.facilities.findFirst({
      where: eq(schema.facilities.id, user.facilityId),
      with: {
          district: true
      }
  });

  if (!userFacility) {
      return c.json({ error: "User facility not found" }, HttpStatusCodes.NOT_FOUND);
  }

  const data = await db
    .select({
      id: schema.executionData.id,
      q1Amount: schema.executionData.q1Amount,
      q2Amount: schema.executionData.q2Amount,
      q3Amount: schema.executionData.q3Amount,
      q4Amount: schema.executionData.q4Amount,
      cumulativeBalance: schema.executionData.cumulativeBalance,
      comment: schema.executionData.comment,
      categoryCode: schema.categories.code,
      categoryName: schema.categories.name,
      categoryOrder: schema.categories.displayOrder,
      subCategoryCode: schema.subCategories.code,
      subCategoryName: schema.subCategories.name,
      subCategoryOrder: schema.subCategories.displayOrder,
      activityName: schema.activities.name,
      activityOrder: schema.activities.displayOrder,
      isTotalRow: schema.activities.isTotalRow,
    })
    .from(schema.executionData)
    .innerJoin(
      schema.activities,
      eq(schema.executionData.activityId, schema.activities.id)
    )
    .innerJoin(
      schema.categories,
      eq(schema.activities.categoryId, schema.categories.id)
    )
    .leftJoin(
      schema.subCategories,
      eq(schema.activities.subCategoryId, schema.subCategories.id)
    )
    .innerJoin(
      schema.facilities,
      eq(schema.executionData.facilityId, schema.facilities.id)
    )
    .where(
      and(
        eq(schema.executionData.reportingPeriodId, reportingPeriodId),
        eq(schema.facilities.districtId, userFacility.districtId) // Filter by user's district
      )
    )
    .orderBy(
      asc(schema.categories.displayOrder),
      asc(schema.subCategories.displayOrder),
      asc(schema.activities.displayOrder)
    );

  return c.json({ data }, HttpStatusCodes.OK);
};

export const getCategorySummary: AppRouteHandler<
  GetCategorySummaryRoute
> = async (c) => {
  const { reportingPeriodId } = c.req.valid("param");
  const user = c.get("user");
  
  if (!user?.facilityId) {
      return c.json({ error: "User facility not found" }, HttpStatusCodes.UNAUTHORIZED);
  }

  // Get the user's facility to determine their district
  const userFacility = await db.query.facilities.findFirst({
      where: eq(schema.facilities.id, user.facilityId),
      with: {
          district: true
      }
  });

  if (!userFacility) {
      return c.json({ error: "User facility not found" }, HttpStatusCodes.NOT_FOUND);
  }

  const data = await db
    .select({
      categoryCode: schema.categories.code,
      categoryName: schema.categories.name,
      totalActivities: count(schema.executionData.id),
      totalQ1: sum(schema.executionData.q1Amount),
      totalQ2: sum(schema.executionData.q2Amount),
      totalQ3: sum(schema.executionData.q3Amount),
      totalQ4: sum(schema.executionData.q4Amount),
      totalCumulative: sum(sql`q1_amount + q2_amount + q3_amount + q4_amount`),
    })
    .from(schema.executionData)
    .innerJoin(
      schema.activities,
      eq(schema.executionData.activityId, schema.activities.id)
    )
    .innerJoin(
      schema.categories,
      eq(schema.activities.categoryId, schema.categories.id)
    )
    .innerJoin(
      schema.facilities,
      eq(schema.executionData.facilityId, schema.facilities.id)
    )
    .where(
      and(
        eq(schema.executionData.reportingPeriodId, reportingPeriodId),
        eq(schema.facilities.districtId, userFacility.districtId) // Filter by user's district
      )
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

export const getUserExecutionData: AppRouteHandler<
  GetUserExecutionDataRoute
> = async (c) => {
  const { userId, reportingPeriodId } = c.req.valid("param");
  const user = c.get("user");
  
  if (!user?.facilityId) {
      return c.json({ error: "User facility not found" }, HttpStatusCodes.UNAUTHORIZED);
  }

  // Get the user's facility to determine their district
  const userFacility = await db.query.facilities.findFirst({
      where: eq(schema.facilities.id, user.facilityId),
      with: {
          district: true
      }
  });

  if (!userFacility) {
      return c.json({ error: "User facility not found" }, HttpStatusCodes.NOT_FOUND);
  }

  const data = await db
    .select({
      id: schema.executionData.id,
      q1Amount: schema.executionData.q1Amount,
      q2Amount: schema.executionData.q2Amount,
      q3Amount: schema.executionData.q3Amount,
      q4Amount: schema.executionData.q4Amount,
      cumulativeBalance: schema.executionData.cumulativeBalance,
      comment: schema.executionData.comment,
      activityName: schema.activities.name,
      categoryName: schema.categories.name,
      subCategoryName: schema.subCategories.name,
    })
    .from(schema.executionData)
    .innerJoin(
      schema.activities,
      eq(schema.executionData.activityId, schema.activities.id)
    )
    .innerJoin(
      schema.categories,
      eq(schema.activities.categoryId, schema.categories.id)
    )
    .leftJoin(
      schema.subCategories,
      eq(schema.activities.subCategoryId, schema.subCategories.id)
    )
    .innerJoin(
      schema.facilities,
      eq(schema.executionData.facilityId, schema.facilities.id)
    )
    .where(
      and(
        eq(schema.executionData.reportingPeriodId, reportingPeriodId),
        eq(schema.executionData.createdBy, userId),
        eq(schema.facilities.districtId, userFacility.districtId) // Filter by user's district
      )
    )
    .orderBy(
      asc(schema.categories.displayOrder),
      asc(schema.subCategories.displayOrder),
      asc(schema.activities.displayOrder)
    );

  return c.json({ data }, HttpStatusCodes.OK);
}; 