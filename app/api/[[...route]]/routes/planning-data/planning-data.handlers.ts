import { AppRouteHandler } from "../../lib/types";
import { CheckExistsRoute, CreateRoute, UpdateRoute } from "./planning-data.routes";
import { and, eq, ne } from "drizzle-orm";
import db from "@/db";
import * as schema from "@/db/schema";
import * as StatusCodes from "stoker/http-status-codes";
import { mapPlanningData } from "./planning-data.schema";
import { syncPlanningDataToLedger } from "./planning-data.service";

export const create: AppRouteHandler<CreateRoute> = async (c) => {
    try {
        const body = c.req.valid("json");

        // Resolve projectId from the planning activity itself –– this is treated as the single source of truth.
        const activityRow = await db.query.planningActivities.findFirst({
            columns: { projectId: true },
            where: eq(schema.planningActivities.id, body.planningActivityId),
        });

        const derivedProjectId = activityRow?.projectId ?? null;

        if (!derivedProjectId) {
            return c.json({ error: "BAD_REQUEST", message: "Planning activity not found" }, 400);
        }

        // If the client supplied a projectId, ensure it matches the derived one.
        if (body.projectId !== undefined && body.projectId !== derivedProjectId) {
            return c.json({
                error: "BAD_REQUEST",
                message: "Provided projectId does not match planning activity's projectId",
            }, 400);
        }

        // Duplicate-check including activity as well as derived projectId
        const duplicate = await db.query.planningData.findFirst({
            where: and(
                eq(schema.planningData.reportingPeriodId, body.reportingPeriodId),
                eq(schema.planningData.projectId, derivedProjectId),
                eq(schema.planningData.facilityId, body.facilityId),
                eq(schema.planningData.activityId, body.planningActivityId),
            ),
        });

        if (duplicate) {
            return c.json({
                error: "CONFLICT",
                message: "Planning data already exists for this reporting period, activity, facility, and project",
            }, 409);
        }

        const newRow = await db.transaction(async (tx) => {
            try {
                // 1. Insert planning_data
                const { planningActivityId, projectId: _omit, frequency, unitCost, ...rest } = body;

                const insertData = {
                    ...rest,
                    activityId: planningActivityId,
                    projectId: derivedProjectId,
                    frequency: frequency.toString(),
                    unitCost: unitCost.toString(),
                };

                const [row] = await tx.insert(schema.planningData)
                    .values(insertData)
                    .returning();

                c.get("logger")?.info("Planning data created, syncing to ledger...", { planningId: row.id });

                // 2. Mirror to ledger (uses the same tx)
                await syncPlanningDataToLedger(row.id, tx);

                c.get("logger")?.info("Ledger sync completed", { planningId: row.id });

                return row;
            } catch (txError: any) {
                c.get("logger").error("Transaction error:", txError);
                
                // Check if it's a unique constraint violation
                if (txError?.code === '23505' || txError?.constraint === 'plan_data_unique') {
                    throw new Error('DUPLICATE_ENTRY');
                }
                
                throw txError; // Re-throw other errors
            }
        });

        c.get("logger")?.info("Transaction completed successfully, fetching complete data...", { planningId: newRow.id });

        // 3. Fetch complete data for response (can use plain db, record is already committed)
        let completeData;
        try {
            // Try the full query first
            completeData = await db.query.planningData.findFirst({
                where: eq(schema.planningData.id, newRow.id),
                with: {
                    planningActivity: {
                        with: {
                            planningCategory: true,
                        },
                    },
                    reportingPeriod: true,
                },
            });
            c.get("logger")?.info("Complete data query finished", { planningId: newRow.id, found: !!completeData });
        } catch (queryError) {
            c.get("logger")?.error("Failed to query complete data with relations, trying simple query", { planningId: newRow.id, error: queryError });
            
            // Fallback to simpler query without nested relations
            try {
                completeData = await db.query.planningData.findFirst({
                    where: eq(schema.planningData.id, newRow.id),
                    with: {
                        planningActivity: true,
                        reportingPeriod: true,
                    },
                });
                c.get("logger")?.info("Simple data query finished", { planningId: newRow.id, found: !!completeData });
            } catch (simpleQueryError) {
                c.get("logger")?.error("Failed to query complete data with simple query", { planningId: newRow.id, error: simpleQueryError });
                
                // Last fallback - basic query without any relations
                try {
                    completeData = await db.query.planningData.findFirst({
                        where: eq(schema.planningData.id, newRow.id),
                    });
                    c.get("logger")?.info("Basic data query finished", { planningId: newRow.id, found: !!completeData });
                } catch (basicQueryError) {
                    c.get("logger")?.error("Failed to query basic data", { planningId: newRow.id, error: basicQueryError });
                    throw basicQueryError;
                }
            }
        }

        if (!completeData) {
            c.get("logger")?.error("Failed to fetch planning data after creation", { planningId: newRow.id });
            return c.json({
                error: "INTERNAL_ERROR", 
                message: "Planning data was created but could not be retrieved"
            }, 500);
        }

        c.get("logger")?.info("About to map planning data...", { planningId: newRow.id });
        
        let mappedData;
        try {
            mappedData = mapPlanningData(completeData);
            c.get("logger")?.info("Planning data mapped successfully", { planningId: newRow.id });
        } catch (mapError) {
            c.get("logger")?.error("Failed to map planning data", { planningId: newRow.id, error: mapError });
            throw mapError;
        }

        c.get("logger")?.info("About to return JSON response...", { planningId: newRow.id });
        return c.json(mappedData, StatusCodes.CREATED);

    } catch (error: any) {
        c.get("logger").error("Transaction error:", error);
        
        // Handle duplicate entry specifically
        if (error?.message === 'DUPLICATE_ENTRY') {
            return c.json({
                error: "CONFLICT",
                message: "Planning data already exists for this reporting period, activity, facility, and project",
            }, 409);
        }
        
        // log more details about the error
        if (error instanceof Error) {
            c.get("logger").error("Error details:", {
                message: error.message,
                stack: error.stack,
                name: error.name,
                code: (error as any).code,
                constraint: (error as any).constraint,
                cause: (error as any).cause,
                toString: error.toString(),
            });
        } else {
            c.get("logger").error("Non-Error object thrown:", {
                type: typeof error,
                value: error,
                stringified: JSON.stringify(error),
            });
        }

        return c.json({
            error: "INTERNAL_ERROR",
            message: "Failed to create planning data",
        }, 500);
    }
};

export const update: AppRouteHandler<UpdateRoute> = async (c) => {
    try {
        const { id } = c.req.valid("param");
        const body = c.req.valid("json");

        c.get("logger")?.info("Starting planning data update", { planningId: id, body });

        // Retrieve existing record
        const existingRow = await db.query.planningData.findFirst({
            where: eq(schema.planningData.id, id),
        });

        if (!existingRow) {
            return c.json({ error: "NOT_FOUND", message: "Planning data not found" }, 404);
        }

        // If planningActivityId is being updated, resolve projectId from the new activity
        let derivedProjectId = existingRow.projectId;
        if (body.planningActivityId && body.planningActivityId !== existingRow.activityId) {
            const activityRow = await db.query.planningActivities.findFirst({
                columns: { projectId: true },
                where: eq(schema.planningActivities.id, body.planningActivityId),
            });

            if (!activityRow) {
                return c.json({ error: "BAD_REQUEST", message: "Planning activity not found" }, 400);
            }

            derivedProjectId = activityRow.projectId;

            // If the client supplied a projectId, ensure it matches the derived one
            if (body.projectId !== undefined && body.projectId !== derivedProjectId) {
                return c.json({
                    error: "BAD_REQUEST",
                    message: "Provided projectId does not match planning activity's projectId",
                }, 400);
            }
        }

        // Determine final composite keys after update
        const newReportingPeriodId = body.reportingPeriodId ?? existingRow.reportingPeriodId;
        const newActivityId = body.planningActivityId ?? existingRow.activityId;
        const newFacilityId = body.facilityId ?? existingRow.facilityId;
        const newProjectId = derivedProjectId;
        
        // Check uniqueness constraint (only if key fields are changing)
        const isKeyFieldsChanging = (
            newReportingPeriodId !== existingRow.reportingPeriodId ||
            newActivityId !== existingRow.activityId ||
            newFacilityId !== existingRow.facilityId ||
            newProjectId !== existingRow.projectId
        );

        if (isKeyFieldsChanging) {
            const conflict = await db.query.planningData.findFirst({
                where: and(
                    eq(schema.planningData.reportingPeriodId, newReportingPeriodId),
                    eq(schema.planningData.activityId, newActivityId),
                    eq(schema.planningData.facilityId, newFacilityId),
                    eq(schema.planningData.projectId, newProjectId),
                    ne(schema.planningData.id, id)
                ),
            });

            if (conflict) {
                return c.json({
                    error: "CONFLICT",
                    message: "Another planning data row already exists with this reporting period, activity, facility, and project",
                }, 409);
            }
        }

        const updatedRow = await db.transaction(async (tx) => {
            try {
                const {
                    planningActivityId,
                    projectId: _omitProjectId,
                    frequency,
                    unitCost,
                    countQ1,
                    countQ2,
                    countQ3,
                    countQ4,
                    ...other
                } = body;

                const updateData: any = {
                    ...other,
                    ...(planningActivityId !== undefined ? { activityId: planningActivityId } : {}),
                    ...(derivedProjectId !== existingRow.projectId ? { projectId: derivedProjectId } : {}),
                    ...(frequency !== undefined ? { frequency: frequency.toString() } : {}),
                    ...(unitCost !== undefined ? { unitCost: unitCost.toString() } : {}),
                    ...(countQ1 !== undefined ? { countQ1 } : {}),
                    ...(countQ2 !== undefined ? { countQ2 } : {}),
                    ...(countQ3 !== undefined ? { countQ3 } : {}),
                    ...(countQ4 !== undefined ? { countQ4 } : {}),
                };

                c.get("logger")?.info("Updating planning data with:", { planningId: id, updateData });

                const [updated] = await tx.update(schema.planningData)
                    .set(updateData)
                    .where(eq(schema.planningData.id, id))
                    .returning();

                c.get("logger")?.info("Planning data updated, syncing to ledger...", { planningId: id });

                // Sync to ledger using the same transaction
                await syncPlanningDataToLedger(id, tx);

                c.get("logger")?.info("Ledger sync completed for update", { planningId: id });

                return updated;
            } catch (txError: any) {
                c.get("logger").error("Transaction error during update:", txError);
                
                // Check if it's a unique constraint violation
                if (txError?.code === '23505' || txError?.constraint === 'plan_data_unique') {
                    throw new Error('DUPLICATE_ENTRY');
                }
                
                throw txError; // Re-throw other errors
            }
        });

        c.get("logger")?.info("Transaction completed successfully for update, fetching complete data...", { planningId: id });

        // Fetch complete data for response
        let completeData;
        try {
            // Try the full query first
            completeData = await db.query.planningData.findFirst({
                where: eq(schema.planningData.id, id),
                with: {
                    planningActivity: {
                        with: {
                            planningCategory: true,
                        },
                    },
                    reportingPeriod: true,
                },
            });
            c.get("logger")?.info("Complete data query finished for update", { planningId: id, found: !!completeData });
        } catch (queryError) {
            c.get("logger")?.error("Failed to query complete data with relations, trying simple query", { planningId: id, error: queryError });
            
            // Fallback to simpler query without nested relations
            try {
                completeData = await db.query.planningData.findFirst({
                    where: eq(schema.planningData.id, id),
                    with: {
                        planningActivity: true,
                        reportingPeriod: true,
                    },
                });
                c.get("logger")?.info("Simple data query finished for update", { planningId: id, found: !!completeData });
            } catch (simpleQueryError) {
                c.get("logger")?.error("Failed to query complete data with simple query", { planningId: id, error: simpleQueryError });
                
                // Last fallback - basic query without any relations
                try {
                    completeData = await db.query.planningData.findFirst({
                        where: eq(schema.planningData.id, id),
                    });
                    c.get("logger")?.info("Basic data query finished for update", { planningId: id, found: !!completeData });
                } catch (basicQueryError) {
                    c.get("logger")?.error("Failed to query basic data after update", { planningId: id, error: basicQueryError });
                    throw basicQueryError;
                }
            }
        }

        if (!completeData) {
            c.get("logger")?.error("Failed to fetch planning data after update", { planningId: id });
            return c.json({
                error: "INTERNAL_ERROR", 
                message: "Planning data was updated but could not be retrieved"
            }, 500);
        }

        c.get("logger")?.info("About to map planning data for update response...", { planningId: id });
        
        let mappedData;
        try {
            mappedData = mapPlanningData(completeData);
            c.get("logger")?.info("Planning data mapped successfully for update", { planningId: id });
        } catch (mapError) {
            c.get("logger")?.error("Failed to map planning data after update", { planningId: id, error: mapError });
            throw mapError;
        }

        c.get("logger")?.info("About to return JSON response for update...", { planningId: id });
        return c.json(mappedData, StatusCodes.OK);

    } catch (error: any) {
        c.get("logger").error("Error updating planning data:", error);
        
        // Handle duplicate entry specifically
        if (error?.message === 'DUPLICATE_ENTRY') {
            return c.json({
                error: "CONFLICT",
                message: "Planning data already exists for this reporting period, activity, facility, and project",
            }, 409);
        }
        
        // Log more details about the error
        if (error instanceof Error) {
            c.get("logger").error("Update error details:", {
                message: error.message,
                stack: error.stack,
                name: error.name,
                code: (error as any).code,
                constraint: (error as any).constraint,
                cause: (error as any).cause,
                toString: error.toString(),
            });
        } else {
            c.get("logger").error("Non-Error object thrown during update:", {
                type: typeof error,
                value: error,
                stringified: JSON.stringify(error),
            });
        }

        return c.json({
            error: "INTERNAL_ERROR",
            message: "Failed to update planning data",
        }, 500);
    }
}

export const checkExists: AppRouteHandler<CheckExistsRoute> = async (c) => {
    const { reportingPeriodId, projectId, facilityId } = c.req.valid("query");
    
    const data = await db.query.planningData.findFirst({
        where: and(
            eq(schema.planningData.reportingPeriodId, reportingPeriodId),
            eq(schema.planningData.projectId, projectId),
            eq(schema.planningData.facilityId, facilityId),
        ),
        columns: {
            id: true,
        },
    });

    if (data) {
        return c.json({ exists: true, id: data.id }, StatusCodes.OK);
    }

    return c.json({ exists: false, id: null }, StatusCodes.OK);
}   