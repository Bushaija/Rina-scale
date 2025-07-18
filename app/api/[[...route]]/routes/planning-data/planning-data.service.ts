import { db } from "@/db";
import * as s from "@/db/schema";
import { sql, eq } from "drizzle-orm";

export async function syncPlanningDataToLedger(
    planningId: number,
    client: any = db,
) {
    try {
        // 1. Load the planning row + its mapped event_id from planning_activity_event_mappings
        const [row] = await client
            .select({
                pd: s.planningData,
                eventId: s.events.id,
                eventType: s.events.eventType,
            })
            .from(s.planningData)
            .leftJoin(
                s.planningActivityEventMappings,
                eq(s.planningActivityEventMappings.planningActivityId, s.planningData.activityId)
            )
            .leftJoin(
                s.events,
                eq(s.events.id, s.planningActivityEventMappings.eventId)
            )
            .where(eq(s.planningData.id, planningId));

        if (!row || !row.eventId) {
            console.log(`🔍 No event mapping found for planning activity ${planningId}, skipping ledger sync`);
            return;
        }

    // 2. Build ledger records for each quarter (only >0 amounts)
    const quarters = [
        { q: 1, amount: row.pd.amountQ1 },
        { q: 2, amount: row.pd.amountQ2 },
        { q: 3, amount: row.pd.amountQ3 },
        { q: 4, amount: row.pd.amountQ4 },
    ].filter((q) => Number(q.amount) !== 0);

    if (quarters.length === 0) return;

    // Ensure we respect Drizzle's column types (numeric -> string)
    const ledgerRows: typeof s.financialEvents.$inferInsert[] = quarters.map((q) => ({
        eventId:           row.eventId!,
        amount:            q.amount as unknown as string, // numeric expects string
        direction:         row.eventType === "REVENUE" ? "CREDIT" : "DEBIT",
        reportingPeriodId: row.pd.reportingPeriodId!,
        facilityId:        row.pd.facilityId!,
        quarter:           q.q,
        projectId:         row.pd.projectId!,
        sourceTable:       "planning_data",
        sourceId:          planningId,
    }));

    // 3. UPSERT (idempotent)
    await client
        .insert(s.financialEvents)
        .values(ledgerRows)
        .onConflictDoUpdate({
            target: [
                s.financialEvents.eventId,
                s.financialEvents.reportingPeriodId,
                s.financialEvents.facilityId,
                s.financialEvents.quarter,
                s.financialEvents.sourceId,
            ],
            set: {
                amount: sql`excluded.amount`,
                direction: sql`excluded.direction`,
                updatedAt: sql`CURRENT_TIMESTAMP`,
            },
        });
    } catch (error) {
        console.error(`❌ Error syncing planning data ${planningId} to ledger:`, error);
        // Don't throw the error to avoid breaking the main transaction
        // This allows planning data to be saved even if ledger sync fails
    }
}