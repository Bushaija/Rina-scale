import db from "@/db";
import * as schema from "@/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";

import type { AppRouteHandler } from "../../lib/types";
import type {
  DeleteExecutionDataRoute,
  GetRecentActivityRoute,
  BulkUpsertExecutionDataRoute,
} from "./utilities.routes";
import * as HttpStatusCodes from "stoker/http-status-codes";

export const deleteExecutionData: AppRouteHandler<
  DeleteExecutionDataRoute
> = async (c) => {
  const { id } = c.req.valid("param");
  const { userId } = c.req.valid("json");

  const [deleted] = await db
    .delete(schema.executionData)
    .where(
      and(eq(schema.executionData.id, id), eq(schema.executionData.createdBy, userId))
    )
    .returning({ id: schema.executionData.id });

  if (!deleted) {
    return c.json(
      {
        error: "NOT_FOUND",
        message: "Execution data not found or user not authorized to delete",
      },
      HttpStatusCodes.NOT_FOUND
    );
  }

  return c.json({ id: deleted.id }, HttpStatusCodes.OK);
};

export const getRecentActivity: AppRouteHandler<
  GetRecentActivityRoute
> = async (c) => {
  const { userId } = c.req.valid("param");

  const data = await db
    .select({
      updatedAt: schema.executionData.updatedAt,
      activityName: schema.activities.name,
      categoryName: schema.categories.name,
      year: schema.reportingPeriods.year,
      actionType: sql<string>`'execution_data'`.as("action_type"),
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
      schema.reportingPeriods,
      eq(schema.executionData.reportingPeriodId, schema.reportingPeriods.id)
    )
    .where(eq(schema.executionData.createdBy, userId))
    .orderBy(desc(schema.executionData.updatedAt))
    .limit(10);

  return c.json({ data }, HttpStatusCodes.OK);
};

export const bulkUpsertExecutionData: AppRouteHandler<
  BulkUpsertExecutionDataRoute
> = async (c) => {
  const { items } = c.req.valid("json");

  const data = await db
    .insert(schema.executionData)
    .values(items)
    .onConflictDoUpdate({
      target: [
        schema.executionData.reportingPeriodId,
        schema.executionData.activityId,
      ],
      set: {
        q1Amount: sql`excluded.q1_amount`,
        q2Amount: sql`excluded.q2_amount`,
        q3Amount: sql`excluded.q3_amount`,
        q4Amount: sql`excluded.q4_amount`,
        comment: sql`excluded.comment`,
        updatedBy: sql`excluded.created_by`,
        updatedAt: sql`CURRENT_TIMESTAMP`,
      },
    })
    .returning({
      id: schema.executionData.id,
      cumulativeBalance: schema.executionData.cumulativeBalance,
    });

  return c.json({ data }, HttpStatusCodes.OK);
};
