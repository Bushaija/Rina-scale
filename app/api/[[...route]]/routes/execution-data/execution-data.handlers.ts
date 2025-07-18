import { StatusCodes } from "http-status-codes";
import { mapExecutionData } from "./execution-data.schema";
import { AppRouteHandler } from "../../lib/types";
import { ListRoute, GetOneRoute, CreateRoute, UpdateRoute, RemoveRoute, GetByPeriodAndActivityRoute, CheckExistsRoute } from "./execution-data.routes";
import { eq, and, desc, ne } from "drizzle-orm";
import db from "@/db";
import * as schema from "@/db/schema";
import { syncExecutionDataToLedger } from "./execution-data.service";
import { syncExecutionDataToLedgerSimple } from "./execution-data.service"; 

export const list: AppRouteHandler<ListRoute> = async (c) => {
    const query = c.req.valid("query");
    const limit = query.limit || 50;
    const offset = query.offset || 0;

    // Build dynamic where conditions
    const whereConditions = [];
    if (query.reportingPeriodId) {
      whereConditions.push(eq(schema.executionData.reportingPeriodId, Number(query.reportingPeriodId)));
    }
    if (query.facilityId) {
      whereConditions.push(eq(schema.executionData.facilityId, Number(query.facilityId)));
    }

    // Query with relations
    const results = await db.query.executionData.findMany({
      limit: limit + 1, // Get one extra to check if there's a next page
      offset,
      where: whereConditions.length > 0 ? and(...whereConditions) : undefined,
      with: {
        activity: {
          with: {
            category: true,
            subCategory: true,
          },
        },
        reportingPeriod: true,
      },
      orderBy: desc(schema.executionData.updatedAt),
    });

    const hasNext = results.length > limit;
    const data = hasNext ? results.slice(0, limit) : results;

    // Get total count for pagination
    const totalResult = await db.$count(schema.executionData, 
      whereConditions.length > 0 ? and(...whereConditions) : undefined
    );

    return c.json({
      data: data.map(mapExecutionData),
      pagination: {
        total: totalResult,
        limit,
        offset,
        hasNext,
      },
    }, StatusCodes.OK);
};

export const getOne: AppRouteHandler<GetOneRoute> = async (c) => {
  try {
    const { id } = c.req.valid("param");

    const executionData = await db.query.executionData.findFirst({
      where: eq(schema.executionData.id, id),
      with: {
        activity: {
          with: {
            category: true,
            subCategory: true,
          },
        },
        reportingPeriod: true,
      },
    });

    if (!executionData) {
      return c.json(
        {
          error: "NOT_FOUND",
          message: "Execution data not found",
        },
        404
      );
    }

    return c.json(mapExecutionData(executionData), StatusCodes.OK);
  } catch (error) {
    c.get("logger").error("Error getting execution data:", error);
    return c.json(
      {
        error: "INTERNAL_ERROR",
        message: "Failed to retrieve execution data",
      },
      500
    );
  }
};

export const create: AppRouteHandler<CreateRoute> = async (c) => {
  try {
    const body = c.req.valid("json");

    console.log("body", body);

    // Check for existing record first (outside of transaction for better performance)
    const existing = await db.query.executionData.findFirst({
      where: and(
        eq(schema.executionData.reportingPeriodId, body.reportingPeriodId),
        eq(schema.executionData.activityId, body.activityId),
        eq(schema.executionData.facilityId, body.facilityId),
        eq(schema.executionData.projectId, body.projectId),
      ),
    });

    if (existing) {
      return c.json(
        {
          error: "CONFLICT",
          message:
            "Execution data already exists for this reporting period, activity, facility, and project",
        },
        409
      );
    }

    const newRow = await db.transaction(async (tx) => {
      try {
        // 1. Insert execution_data
        const [row] = await tx.insert(schema.executionData)
                              .values(body)
                              .returning();

        console.log("row", row);

        c.get("logger")?.info("Execution data created, syncing to ledger...", { executionId: row.id });

        // 2. Mirror to ledger (uses the same tx)
        // await syncExecutionDataToLedger(row.id, tx);
        await syncExecutionDataToLedgerSimple(row.id, tx);

        c.get("logger")?.info("Ledger sync completed", { executionId: row.id });

        return row;
      } catch (txError) {
        console.log("txError", txError);
        c.get("logger").error("Transaction error:", txError);
        throw txError; // Re-throw to rollback transaction
      }
    });

    // 3. Fetch complete data for response (can use plain db, record is already committed)
    let completeData = await db.query.executionData.findFirst({
      where: eq(schema.executionData.id, newRow.id),
      with: {
        activity: {
          with: {
            category: true,
            subCategory: true,
          },
        },
        reportingPeriod: true,
      },
    });

    // console.log("[ExecutionData API] completeData", completeData);

    // if (!completeData) {
    //   completeData = newRow as any;
    // }

    // const responseData = mapExecutionData(completeData);
    // c.get("logger").info(
    //   { responseData },
    //   "[ExecutionData API] response payload"
    // );

    return c.json(mapExecutionData(completeData), StatusCodes.CREATED);
  } catch (error) {
    console.log("error::", error);
    c.get("logger").error("Error creating execution data:", error);
    
    // Log more details about the error
    if (error instanceof Error) {
      c.get("logger").error("Error details:", {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
    }
    
    return c.json(
      {
        error: "INTERNAL_ERROR",
        message: "Failed to create execution data",
      },
      500
    );
  }
};

export const update: AppRouteHandler<UpdateRoute> = async (c) => {
  try {
    const { id } = c.req.valid("param");
    const body = c.req.valid("json");
    const user = c.get("user");

    // Retrieve existing record
    const existingRow = await db.query.executionData.findFirst({
      where: eq(schema.executionData.id, id),
    });

    if (!existingRow) {
      return c.json(
        { error: "NOT_FOUND", message: "Execution data not found" },
        404
      );
    }

    // Determine final composite keys after update
    const newReportingPeriodId =
      body.reportingPeriodId ?? existingRow.reportingPeriodId ?? 0;
    const newActivityId = body.activityId ?? existingRow.activityId ?? 0;
    const newFacilityId = body.facilityId ?? existingRow.facilityId ?? 0;
    const newProjectId = body.projectId ?? existingRow.projectId ?? 0;

    // Check uniqueness constraint
    const conflict = await db.query.executionData.findFirst({
      where: and(
        eq(schema.executionData.reportingPeriodId, newReportingPeriodId),
        eq(schema.executionData.activityId, newActivityId),
        eq(schema.executionData.facilityId, newFacilityId),
        eq(schema.executionData.projectId, newProjectId),
        ne(schema.executionData.id, id)
      ),
    });

    if (conflict) {
      return c.json(
        {
          error: "CONFLICT",
          message:
            "Another execution data row already exists with this reporting period, activity, facility, and project",
        },
        409
      );
    }

    await db.transaction(async (tx) => {
      const [updated] = await tx.update(schema.executionData)
                                .set(body)
                                .where(eq(schema.executionData.id, id))
                                .returning();
      await syncExecutionDataToLedger(id, tx);
    });

    const completeData = await db.query.executionData.findFirst({
      where: eq(schema.executionData.id, id),
      with: {
        activity: {
          with: {
            category: true,
            subCategory: true,
          },
        },
        reportingPeriod: true,
      },
    });

    return c.json(mapExecutionData(completeData), StatusCodes.OK);
  } catch (error) {
    c.get("logger").error("Error updating execution data:", error);
    return c.json(
      {
        error: "INTERNAL_ERROR",
        message: "Failed to update execution data",
      },
      500
    );
  }
};

export const remove: AppRouteHandler<RemoveRoute> = async (c) => {
  try {
    const { id } = c.req.valid("param");

    const [deletedExecutionData] = await db
      .delete(schema.executionData)
      .where(eq(schema.executionData.id, id))
      .returning();

    if (!deletedExecutionData) {
      return c.json(
        {
          error: "NOT_FOUND",
          message: "Execution data not found",
        },
        404
      );
    }

    return c.body(null, 204);
  } catch (error) {
    c.get("logger").error("Error deleting execution data:", error);
    return c.json(
      {
        error: "INTERNAL_ERROR",
        message: "Failed to delete execution data",
      },
      500
    );
  }
};

export const getByPeriodAndActivity: AppRouteHandler<GetByPeriodAndActivityRoute> = async (c) => {
    const { reportingPeriodId, activityId, facilityId, projectId } = c.req.valid("query");

    const data = await db.query.executionData.findFirst({
        where: and(
            eq(schema.executionData.reportingPeriodId, reportingPeriodId),
            eq(schema.executionData.activityId, activityId),
            eq(schema.executionData.facilityId, facilityId),
            eq(schema.executionData.projectId, projectId),
        ),
        columns: {
            facilityId: true,
            id: true,
            q1Amount: true,
            q2Amount: true,
            q3Amount: true,
            q4Amount: true,
            cumulativeBalance: true,
            comment: true,
            createdAt: true,
            updatedAt: true,
        },
    });

    if (!data) {
        return c.json({
            error: "NOT_FOUND",
            message: "Execution data not found for this period and activity"
        }, StatusCodes.NOT_FOUND);
    }

    return c.json(data, StatusCodes.OK);
};

export const checkExists: AppRouteHandler<CheckExistsRoute> = async (c) => {
    const { reportingPeriodId, activityId, facilityId, projectId } = c.req.valid("query");

    const data = await db.query.executionData.findFirst({
        where: and(
            eq(schema.executionData.reportingPeriodId, reportingPeriodId),
            eq(schema.executionData.activityId, activityId),
            eq(schema.executionData.facilityId, facilityId),
            eq(schema.executionData.projectId, projectId),
        ),
        columns: {
            id: true,
        },
    });

    if (data) {
        return c.json({ exists: true, id: data.id }, StatusCodes.OK);
    }

    return c.json({ exists: false, id: null }, StatusCodes.OK);
};