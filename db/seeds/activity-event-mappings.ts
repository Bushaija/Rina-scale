import type { Database } from "@/db";
import * as schema from "@/db/schema";

const map: { activity: string; event: string }[] = [
  // Receipts
  { activity: "Other Incomes", event: "OTHER_REVENUE" },
  { activity: "Transfers from SPIU/RBC", event: "TRANSFERS_PUBLIC_ENTITIES" },

  // Expenditures
  { activity: "Laboratory Technician", event: "GOODS_SERVICES" },
  { activity: "Nurse", event: "GOODS_SERVICES" },

  { activity: "Supervision CHWs", event: "GOODS_SERVICES" },
  { activity: "Support group meetings", event: "GOODS_SERVICES" },

  { activity: "Sample transport", event: "GOODS_SERVICES" },
  { activity: "Home visit lost to follow up", event: "GOODS_SERVICES" },
  { activity: "Transport and travel for survey/surveillance", event: "GOODS_SERVICES" },

  { activity: "Infrastructure support", event: "GOODS_SERVICES" },
  { activity: "Office supplies", event: "GOODS_SERVICES" },
  { activity: "Transport and travel (Reporting)", event: "GOODS_SERVICES" },
  { activity: "Bank charges", event: "GOODS_SERVICES" },

  { activity: "Transfer to RBC", event: "GRANTS_TRANSFERS" },

  // Assets
  { activity: "Cash at bank", event: "CASH_EQUIVALENTS_END" },
  { activity: "Petty cash", event: "CASH_EQUIVALENTS_END" },
  { activity: "Receivables (VAT refund)", event: "ADVANCE_PAYMENTS" },
  { activity: "Other Receivables", event: "ADVANCE_PAYMENTS" },

  // Liabilities
  { activity: "Salaries on borrowed funds (BONUS)", event: "PAYABLES" },
  { activity: "Payable - Maintenance & Repairs", event: "PAYABLES" },
  { activity: "Payable - Office suppliers", event: "PAYABLES" },
  { activity: "Payable - Transportation fees", event: "PAYABLES" },
  { activity: "VAT refund to RBC", event: "PAYABLES" }, // OTHER PAYABLES

  // Closing balance
  { activity: "Accumulated Surplus/Deficit", event: "ACCUMULATED_SURPLUS_DEFICITS" },
  { activity: "Prior Year Adjustment", event: "PRIOR_YEAR_ADJUSTMENTS" },
];

export default async function seed(db: Database) {
  const events = await db.select().from(schema.events);
  const activities = await db.select().from(schema.activities);

  const eMap = new Map(events.map(e => [e.code, e.id]));
  const aMap = new Map(activities.map(a => [a.name, a.id]));

  const rows = map.map(({ activity, event }) => ({
    activityId: aMap.get(activity)!,
    eventId: eMap.get(event)!,
  }));

  await db
    .insert(schema.activityEventMappings)
    .values(rows)
    .onConflictDoNothing();

  console.log(`Seeded ${rows.length} activity → event mappings`);
}
