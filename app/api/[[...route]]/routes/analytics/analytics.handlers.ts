import db from "@/db";
import * as schema from "@/db/schema";
import { asc, eq, and, count, countDistinct, sum, sql, desc } from "drizzle-orm";

import type { AppRouteHandler } from "../../lib/types";
import type {
  GetUserProgressRoute,
  GetQuarterlyTotalsRoute,
} from "./analytics.routes";
import * as HttpStatusCodes from "stoker/http-status-codes";

export const getUserProgress: AppRouteHandler<GetUserProgressRoute> = async (
  c
) => {
  const { userId } = c.req.valid("param");
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

  const totalCategoriesResult = await db
    .select({ value: count() })
    .from(schema.categories);
  const totalCategories = totalCategoriesResult[0].value;

  const data = await db
    .select({
      year: schema.reportingPeriods.year,
      periodType: schema.reportingPeriods.periodType,
      completedActivities: count(schema.executionData.id),
      categoriesWithData: countDistinct(schema.categories.id),
    })
    .from(schema.reportingPeriods)
    .leftJoin(
      schema.executionData,
      and(
        eq(schema.reportingPeriods.id, schema.executionData.reportingPeriodId),
        eq(schema.executionData.createdBy, userId)
      )
    )
    .leftJoin(
      schema.activities,
      eq(schema.executionData.activityId, schema.activities.id)
    )
    .leftJoin(
      schema.categories,
      eq(schema.activities.categoryId, schema.categories.id)
    )
    .leftJoin(
      schema.facilities,
      eq(schema.executionData.facilityId, schema.facilities.id)
    )
    .where(
      and(
        eq(schema.reportingPeriods.status, "ACTIVE"),
        // Only include execution data from the user's district (or null if no execution data)
        schema.executionData.id !== null ? eq(schema.facilities.districtId, userFacility.districtId) : undefined
      )
    )
    .groupBy(
      schema.reportingPeriods.id,
      schema.reportingPeriods.year,
      schema.reportingPeriods.periodType
    )
    .orderBy(desc(schema.reportingPeriods.year));

  const response = data.map((row) => ({
    ...row,
    totalCategories,
  }));

  return c.json({ data: response }, HttpStatusCodes.OK);
};

export const getQuarterlyTotals: AppRouteHandler<
  GetQuarterlyTotalsRoute
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

  const totals = await db
    .select({
      totalQ1: sum(schema.executionData.q1Amount).mapWith(String),
      totalQ2: sum(schema.executionData.q2Amount).mapWith(String),
      totalQ3: sum(schema.executionData.q3Amount).mapWith(String),
      totalQ4: sum(schema.executionData.q4Amount).mapWith(String),
    })
    .from(schema.executionData)
    .innerJoin(
      schema.facilities,
      eq(schema.executionData.facilityId, schema.facilities.id)
    )
    .where(
      and(
        eq(schema.executionData.reportingPeriodId, reportingPeriodId),
        eq(schema.facilities.districtId, userFacility.districtId) // Filter by user's district
      )
    );

  const result = totals[0];

  const data = [
    { quarter: "Q1", totalAmount: result.totalQ1 ?? "0" },
    { quarter: "Q2", totalAmount: result.totalQ2 ?? "0" },
    { quarter: "Q3", totalAmount: result.totalQ3 ?? "0" },
    { quarter: "Q4", totalAmount: result.totalQ4 ?? "0" },
  ];

  return c.json({ data }, HttpStatusCodes.OK);
};
