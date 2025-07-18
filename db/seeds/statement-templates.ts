import type { Database } from "@/db";
import * as schema from "@/db/schema";
import { getEventCodeIdMap } from "./utils/get-event-map";
import { assetsAndLiabilitiesTemplates, changeInNetAssetsTemplate, cashFlowTemplates, revenueExpenditureTemplates, TemplateLine, budgetVsActualAmountsTemplate } from "./data/statement-templates";
import { sql } from "drizzle-orm";

interface StatementSeed {
  statementCode: string;
  statementName: string;
  templates: TemplateLine[];
}

const statements: StatementSeed[] = [
  {
    statementCode: "REV_EXP",
    statementName: "Statement of Revenue and Expenditure",
    templates: revenueExpenditureTemplates,
  },
  {
    statementCode: "ASSETS_LIAB",
    statementName: "Statement of Assets and Liabilities",
    templates: assetsAndLiabilitiesTemplates,
  },
  {
    statementCode: "CASH_FLOW",
    statementName: "Statement of Cash Flow",
    templates: cashFlowTemplates,
  },
  {
    statementCode: "NET_ASSETS_CHANGES",
    statementName: "Statement of Changes in Net Assets",
    templates: changeInNetAssetsTemplate,
  },
  {
    statementCode: "BUDGET_VS_ACTUAL",
    statementName: "Statement of Budget vs Actual",
    templates: budgetVsActualAmountsTemplate,
  },
];

/* eslint-disable no-console */
export default async function seed(db: Database) {
  console.log("Seeding statement_templates …");
  const eventMap = await getEventCodeIdMap(db);

  for (const stmt of statements) {
    const rows = stmt.templates.map((tpl) => ({
      statementCode: stmt.statementCode,
      statementName: stmt.statementName,
      lineItem: tpl.lineItem,
      eventIds: tpl.eventCodes.map((c) => {
        const id = eventMap.get(c);
        if (id === undefined) throw new Error(`Event code ${c} not found in DB`);
        return id;
      }),
      displayOrder: tpl.displayOrder,
      isTotalLine: tpl.isTotalLine ?? false,
      isSubtotalLine: tpl.isSubtotalLine ?? false,
    }));

    await db.insert(schema.statementTemplates)
  .values(rows)
  .onConflictDoUpdate({
    target: [schema.statementTemplates.statementCode,
             schema.statementTemplates.lineItem],
    set: {
      eventIds: sql`EXCLUDED.event_ids`,
      isTotalLine: sql`EXCLUDED.is_total_line`,
      isSubtotalLine: sql`EXCLUDED.is_subtotal_line`,
      displayOrder: sql`EXCLUDED.display_order`,
      updatedAt: sql`CURRENT_TIMESTAMP`
    }
  });
  }

  console.log("statement_templates seeded.");
} 