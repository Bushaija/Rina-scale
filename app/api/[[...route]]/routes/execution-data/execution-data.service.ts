// execution-data.service.ts - Updated syncExecutionDataToLedger function
import { db } from "@/db";
import * as s from "@/db/schema";
import { sql, eq } from "drizzle-orm";

export async function syncExecutionDataToLedgerSimple(
  executionId: number,
  client: any = db,
) {
  // 1. Load the execution row + its mapped event_id
  const [row] = await client
    .select({
      ed: s.executionData,
      eventId: s.activityEventMappings.eventId,
      eventType: s.events.eventType,
    })
    .from(s.executionData)
    .leftJoin(
      s.activityEventMappings,
      eq(s.activityEventMappings.activityId, s.executionData.activityId)
    )
    .leftJoin(
      s.events,
      eq(s.events.id, s.activityEventMappings.eventId)
    )
    .where(eq(s.executionData.id, executionId));

  if (!row || !row.eventId) return;

  // 2. Delete existing financial events for this execution record
  await client
    .delete(s.financialEvents)
    .where(
      sql`${s.financialEvents.sourceTable} = 'execution_data' 
          AND ${s.financialEvents.sourceId} = ${executionId}`
    );

  // 3. Insert new records
  const quarters = [
    { q: 1, amount: row.ed.q1Amount },
    { q: 2, amount: row.ed.q2Amount },
    { q: 3, amount: row.ed.q3Amount },
    { q: 4, amount: row.ed.q4Amount },
  ].filter((q) => Number(q.amount) !== 0);

  if (quarters.length === 0) return;

  const ledgerRows: typeof s.financialEvents.$inferInsert[] = quarters.map((q) => ({
    eventId: row.eventId!,
    amount: q.amount as unknown as string,
    direction: row.eventType === "REVENUE" ? "CREDIT" : "DEBIT",
    reportingPeriodId: row.ed.reportingPeriodId!,
    facilityId: row.ed.facilityId!,
    projectId: row.ed.projectId!,
    quarter: q.q,
    sourceTable: "execution_data",
    sourceId: executionId,
  }));

  await client.insert(s.financialEvents).values(ledgerRows);
}

/**
 * Upserts financial_events rows that correspond to ONE execution_data record.
 * Call this immediately after you insert/update execution_data.
 */
export async function syncExecutionDataToLedger(
  executionId: number,
  // Accept either the normal db object or a transaction instance
  client: any = db,
) {
  // 1. Load the execution row + its mapped event_id
  const [row] = await client
    .select({
      ed: s.executionData,
      eventId: s.activityEventMappings.eventId,
      eventType: s.events.eventType,
    })
    .from(s.executionData)
    .leftJoin(
      s.activityEventMappings,
      eq(s.activityEventMappings.activityId, s.executionData.activityId)
    )
    .leftJoin(
      s.events,
      eq(s.events.id, s.activityEventMappings.eventId)
    )
    .where(eq(s.executionData.id, executionId));

  if (!row || !row.eventId) return; // no mapping -> ignore

  // 2. Build ledger records for each quarter (only >0 amounts)
  const quarters = [
    { q: 1, amount: row.ed.q1Amount },
    { q: 2, amount: row.ed.q2Amount },
    { q: 3, amount: row.ed.q3Amount },
    { q: 4, amount: row.ed.q4Amount },
  ].filter((q) => Number(q.amount) !== 0);

  if (quarters.length === 0) return;

  // Ensure we respect Drizzle's column types (numeric -> string)
  const ledgerRows: typeof s.financialEvents.$inferInsert[] = quarters.map((q) => ({
    eventId:           row.eventId!,
    amount:            q.amount as unknown as string,
    direction:         row.eventType === "REVENUE" ? "CREDIT" : "DEBIT",
    reportingPeriodId: row.ed.reportingPeriodId!,
    facilityId:        row.ed.facilityId!,
    projectId:         row.ed.projectId!,
    quarter:           q.q,
    sourceTable:       "execution_data",
    sourceId:          executionId,
  }));

  console.log("ledger rows:: ", ledgerRows);

  // 3. UPSERT with project_id update to handle legacy NULL values
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
        amount: sql`EXCLUDED.amount`,
        projectId: sql`EXCLUDED.project_id`, // This will fix legacy NULL values
        // Optionally update other fields that might have changed
        // direction: sql`EXCLUDED.direction`,
        updatedAt: sql`CURRENT_TIMESTAMP`,
      },
    });
}

// execution-data.service.ts - Fixed syncExecutionDataToLedger function
// import { db } from "@/db";
// import * as s from "@/db/schema";
// import { sql, eq } from "drizzle-orm";

// /**
//  * Upserts financial_events rows that correspond to ONE execution_data record.
//  * Call this immediately after you insert/update execution_data.
//  */
// export async function syncExecutionDataToLedger(
//   executionId: number,
//   // Accept either the normal db object or a transaction instance
//   client: any = db,
// ) {
//   // 1. Load the execution row + its mapped event_id
//   const [row] = await client
//     .select({
//       ed: s.executionData,
//       eventId: s.activityEventMappings.eventId,
//       eventType: s.events.eventType,
//     })
//     .from(s.executionData)
//     .leftJoin(
//       s.activityEventMappings,
//       eq(s.activityEventMappings.activityId, s.executionData.activityId)
//     )
//     .leftJoin(
//       s.events,
//       eq(s.events.id, s.activityEventMappings.eventId)
//     )
//     .where(eq(s.executionData.id, executionId));

//   if (!row || !row.eventId) return; // no mapping -> ignore

//   // 2. Build ledger records for each quarter (only >0 amounts)
//   const quarters = [
//     { q: 1, amount: row.ed.q1Amount },
//     { q: 2, amount: row.ed.q2Amount },
//     { q: 3, amount: row.ed.q3Amount },
//     { q: 4, amount: row.ed.q4Amount },
//   ].filter((q) => Number(q.amount) !== 0);

//   if (quarters.length === 0) return;

//   // Ensure we respect Drizzle's column types (numeric -> string)
//   const ledgerRows: typeof s.financialEvents.$inferInsert[] = quarters.map((q) => ({
//     eventId:           row.eventId!,
//     amount:            q.amount as unknown as string,
//     direction:         row.eventType === "REVENUE" ? "CREDIT" : "DEBIT",
//     reportingPeriodId: row.ed.reportingPeriodId!,
//     facilityId:        row.ed.facilityId!,
//     projectId:         row.ed.projectId!,
//     quarter:           q.q,
//     sourceTable:       "execution_data",
//     sourceId:          executionId,
//   }));

//   // 3. UPSERT with project_id update to handle legacy NULL values
//   // Process each ledger row individually to ensure proper conflict resolution
//   for (const ledgerRow of ledgerRows) {
//     await client
//       .insert(s.financialEvents)
//       .values(ledgerRow)
//       .onConflictDoUpdate({
//         target: [
//           s.financialEvents.eventId,
//           s.financialEvents.reportingPeriodId,
//           s.financialEvents.facilityId,
//           s.financialEvents.quarter,
//           s.financialEvents.sourceId,
//         ],
//         set: {
//           amount: ledgerRow.amount as string,
//           direction: ledgerRow.direction,
//           projectId: ledgerRow.projectId!, // Explicitly set the project_id to fix legacy NULL values
//           updatedAt: sql`CURRENT_TIMESTAMP`,
//         },
//       });
//   }
// }