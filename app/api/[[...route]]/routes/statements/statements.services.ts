import { db } from "@/db";
import * as s from "@/db/schema";
import { sql, inArray, and, eq } from "drizzle-orm";

type AmountMap = Map<number, number>;      // eventId → signed amount
type RowDTO = {
  description: string;
  note: number | null;
  current: number | null;
  previous: number | null;
  isTotal: boolean;
  isSubtotal: boolean;
};

/**
 * Helper: returns {eventId -> signed amount} for one period
 */
async function loadAmounts(
  facilityId: number,
  periodId: number,
  eventIds: number[]
): Promise<AmountMap> {
  if (eventIds.length === 0) return new Map();

  // Query actual/executed amounts from financial_events where source_table = 'execution_data'
  const rows = await db
    .select({
      eventId: s.financialEvents.eventId,
      amount: sql<number>`SUM(${s.financialEvents.amount})`.as("amount"),
    })
    .from(s.financialEvents)
    .where(
      and(
        eq(s.financialEvents.facilityId, facilityId),
        eq(s.financialEvents.reportingPeriodId, periodId),
        inArray(s.financialEvents.eventId, eventIds),
        eq(s.financialEvents.sourceTable, 'execution_data')
      )
    )
    .groupBy(s.financialEvents.eventId);

  return new Map(rows.map(r => [r.eventId, Number(r.amount)]));
}

// new helper
async function loadAmountsAll(periodId: number, eventIds: number[]): Promise<AmountMap> {
  // Query actual/executed amounts from financial_events where source_table = 'execution_data'
  const rows = await db
    .select({
      eventId: s.financialEvents.eventId,
      amount: sql<number>`SUM(${s.financialEvents.amount})`.as("amount"),
    })
    .from(s.financialEvents)
    .where(and(
      eq(s.financialEvents.reportingPeriodId, periodId),
      inArray(s.financialEvents.eventId, eventIds),
      eq(s.financialEvents.sourceTable, 'execution_data')
    ))
    .groupBy(s.financialEvents.eventId);

  return new Map(rows.map((r: { eventId: number; amount: number }) => [r.eventId, Number(r.amount)]));
}

/**
 * Main aggregator
 */
export async function getRevExpRows(
  facilityId: number,
  currentPeriodId: number,
  previousPeriodId: number | null
): Promise<RowDTO[]> {
  // 1. Load template
  const template = await db
    .select()
    .from(s.statementTemplates)
    .where(eq(s.statementTemplates.statementCode, "REV_EXP"))
    .orderBy(s.statementTemplates.displayOrder);

  // 2. Collect all eventIds referenced in this statement once
  const allEventIds = Array.from(
    new Set(template.flatMap(r => r.eventIds ?? []))
  );

  // 3. Fetch amounts for current & previous period
  const cur = await loadAmounts(facilityId, currentPeriodId, allEventIds);
  const prev = previousPeriodId
    ? await loadAmounts(facilityId, previousPeriodId, allEventIds)
    : new Map();

  // 4. Walk the template, attach numbers, then roll-up totals
  const rows: RowDTO[] = [];
  let runningSubtotalCur = 0;
  let runningSubTotalPrev = 0;
  let grandCur = 0;
  let grandPrev = 0;

  for (const t of template) {
    // detail lines → sum their eventIds
    let curVal = null;
    let prevVal = null;

    if ((t.eventIds?.length ?? 0) > 0) {
      curVal = t.eventIds.reduce((a, id) => a + (cur.get(id) ?? 0), 0);
      prevVal = t.eventIds.reduce((a, id) => a + (prev.get(id) ?? 0), 0);
      grandCur += curVal;
      grandPrev += prevVal;
      runningSubtotalCur += curVal;
      runningSubTotalPrev += prevVal;
    }

    // subtotal / total rows: value comes from buffer, then buffer resets
    if (t.isSubtotalLine) {
      curVal = runningSubtotalCur;
      prevVal = runningSubTotalPrev;
      runningSubtotalCur = 0;
      runningSubTotalPrev = 0;
    }

    if (t.isTotalLine) {
      curVal = grandCur;
      prevVal = grandPrev;
      runningSubtotalCur = 0;
      runningSubTotalPrev = 0;
      grandCur = 0;
      grandPrev = 0;
    }

    rows.push({
      description: t.lineItem,
      note: t.eventIds?.[0] ?? null, // 1st note as quick reference, or null
      current: curVal,
      previous: prevVal,
      isTotal: Boolean(t.isTotalLine),
      isSubtotal: Boolean(t.isSubtotalLine),
    });
  }

  // Special calc: Surplus / Deficit = last revenue total – last expense total
  const surplusRow = rows.find(r =>
    r.description.includes("SURPLUS") || r.description.includes("DEFICIT")
  );
  if (surplusRow) {
    const totalRev = rows.find(r => r.description === "TOTAL REVENUE");
    const totalExp = rows.find(r => r.description === "TOTAL EXPENSES");
    if (totalRev && totalExp) {
      surplusRow.current = (totalRev.current ?? 0) - (totalExp.current ?? 0);
      surplusRow.previous = (totalRev.previous ?? 0) - (totalExp.previous ?? 0);
    }
  }

  return rows;
}

/**
 * Statement of Assets and Liabilities rows
 */
export async function getAssetsLiabRows(
  facilityId: number,
  currentPeriodId: number,
  previousPeriodId: number | null,
): Promise<RowDTO[]> {
  // 1. Load template for Assets & Liabilities
  const template = await db
    .select()
    .from(s.statementTemplates)
    .where(eq(s.statementTemplates.statementCode, "ASSETS_LIAB"))
    .orderBy(s.statementTemplates.displayOrder);

  // 2. Collect distinct eventIds referenced in template
  const allEventIds = Array.from(new Set(template.flatMap((t) => t.eventIds ?? [])));

  // 3. Load amounts
  const cur = await loadAmounts(facilityId, currentPeriodId, allEventIds);
  const prev = previousPeriodId ? await loadAmounts(facilityId, previousPeriodId, allEventIds) : new Map();

  // 4. Walk template building rows similar to Rev/Exp
  const rows: RowDTO[] = [];
  let runningSubtotalCur = 0;
  let runningSubtotalPrev = 0;
  let grandCur = 0;
  let grandPrev = 0;

  for (const t of template) {
    let curVal: number | null = null;
    let prevVal: number | null = null;

    if ((t.eventIds?.length ?? 0) > 0) {
      curVal = t.eventIds.reduce((a, id) => a + (cur.get(id) ?? 0), 0);
      prevVal = t.eventIds.reduce((a, id) => a + (prev.get(id) ?? 0), 0);
      grandCur += curVal;
      grandPrev += prevVal;
      runningSubtotalCur += curVal;
      runningSubtotalPrev += prevVal;
    }

    if (t.isSubtotalLine) {
      curVal = runningSubtotalCur;
      prevVal = runningSubtotalPrev;
      runningSubtotalCur = 0;
      runningSubtotalPrev = 0;
    }

    if (t.isTotalLine) {
      curVal = grandCur;
      prevVal = grandPrev;
      runningSubtotalCur = 0;
      runningSubtotalPrev = 0;
      grandCur = 0;
      grandPrev = 0;
    }

    rows.push({
      description: t.lineItem,
      note: t.eventIds?.[0] ?? null,
      current: curVal,
      previous: prevVal,
      isTotal: Boolean(t.isTotalLine),
      isSubtotal: Boolean(t.isSubtotalLine),
    });
  }

  // Calculate Surplus/Deficit for the period by getting revenue and expense data
  const surplusRow = rows.find(r => r.description.includes("Surplus/deficits of the period"));
  if (surplusRow) {
    // Get revenue and expense data for current period
    const revExpRowsCurrent = await getRevExpRows(facilityId, currentPeriodId, null);
    const totalRevCurrent = revExpRowsCurrent.find(r => r.description === "TOTAL REVENUE");
    const totalExpCurrent = revExpRowsCurrent.find(r => r.description === "TOTAL EXPENSES");
    
    if (totalRevCurrent && totalExpCurrent) {
      surplusRow.current = (totalRevCurrent.current ?? 0) - (totalExpCurrent.current ?? 0);
    }

    // Get revenue and expense data for previous period if available
    if (previousPeriodId) {
      const revExpRowsPrevious = await getRevExpRows(facilityId, previousPeriodId, null);
      const totalRevPrevious = revExpRowsPrevious.find(r => r.description === "TOTAL REVENUE");
      const totalExpPrevious = revExpRowsPrevious.find(r => r.description === "TOTAL EXPENSES");
      
      if (totalRevPrevious && totalExpPrevious) {
        surplusRow.previous = (totalRevPrevious.current ?? 0) - (totalExpPrevious.current ?? 0);
      }
    }
  }

  // Compute Net Assets rows (C = A - B and Total Net Assets)
  const totalCurrAssets    = rows.find(r => r.description === "Total current assets");
  const totalNonCurrAssets = rows.find(r => r.description === "Total non-current assets");
  const totalAssets        = rows.find(r => r.description === "Total assets (A)");

  const totalCurrLiab      = rows.find(r => r.description === "Total current liabilities");
  const totalNonCurrLiab   = rows.find(r => r.description === "Total non-current liabilities");
  const totalLiabilities   = rows.find(r => r.description === "Total liabilities (B)");

  if (totalAssets && totalCurrAssets && totalNonCurrAssets) {
    totalAssets.current  = (totalCurrAssets.current  ?? 0) + (totalNonCurrAssets.current  ?? 0);
    totalAssets.previous = (totalCurrAssets.previous ?? 0) + (totalNonCurrAssets.previous ?? 0);
  }
  if (totalLiabilities && totalCurrLiab && totalNonCurrLiab) {
    totalLiabilities.current  = (totalCurrLiab.current  ?? 0) + (totalNonCurrLiab.current  ?? 0);
    totalLiabilities.previous = (totalCurrLiab.previous ?? 0) + (totalNonCurrLiab.previous ?? 0);
  }

  const netAssets       = rows.find(r => r.description.startsWith("Net assets"));
  const totalNetAssets  = rows.find(r => r.description === "Total Net Assets");

  if (netAssets && totalAssets && totalLiabilities) {
    netAssets.current  = (totalAssets.current  ?? 0) - (totalLiabilities.current  ?? 0);
    netAssets.previous = (totalAssets.previous ?? 0) - (totalLiabilities.previous ?? 0);
  }
  if (totalNetAssets && netAssets) {
    totalNetAssets.current  = netAssets.current;
    totalNetAssets.previous = netAssets.previous;
  }

  return rows;
}

/**
 * Statement of Cash Flow rows
 */
/**
 * Calculate working capital changes for cash flow statement
 * Based on accountant's rules:
 * - Receivables: current > previous = negative cash flow, current < previous = positive cash flow  
 * - Payables: current > previous = positive cash flow, current < previous = negative cash flow
 */
async function calculateWorkingCapitalChanges(
  rows: RowDTO[],
  facilityId: number,
  currentPeriodId: number,
  previousPeriodId: number | null
): Promise<void> {
  if (!previousPeriodId) return;

  // Get receivables and payables event IDs
  const [receivablesEvents, payablesEvents] = await Promise.all([
    db.select({ id: s.events.id })
      .from(s.events)
      .where(inArray(s.events.code, ['RECEIVABLES_EXCHANGE', 'RECEIVABLES_NON_EXCHANGE'])),
    db.select({ id: s.events.id })
      .from(s.events)
      .where(eq(s.events.code, 'PAYABLES'))
  ]);

  const receivablesEventIds = receivablesEvents.map(e => e.id);
  const payablesEventIds = payablesEvents.map(e => e.id);

  // Load current and previous period amounts
  const [curAmounts, prevAmounts] = await Promise.all([
    loadAmounts(facilityId, currentPeriodId, [...receivablesEventIds, ...payablesEventIds]),
    loadAmounts(facilityId, previousPeriodId, [...receivablesEventIds, ...payablesEventIds])
  ]);

  // Calculate receivables change
  const curReceivables = receivablesEventIds.reduce((sum, id) => sum + (curAmounts.get(id) ?? 0), 0);
  const prevReceivables = receivablesEventIds.reduce((sum, id) => sum + (prevAmounts.get(id) ?? 0), 0);
  const receivablesChange = curReceivables - prevReceivables;
  
  // Calculate payables change  
  const curPayables = payablesEventIds.reduce((sum, id) => sum + (curAmounts.get(id) ?? 0), 0);
  const prevPayables = payablesEventIds.reduce((sum, id) => sum + (prevAmounts.get(id) ?? 0), 0);
  const payablesChange = curPayables - prevPayables;

  // Apply cash flow impact rules and update rows
  const receivablesRow = rows.find(r => r.description === "Changes in receivables");
  if (receivablesRow) {
    // Receivables increase = negative cash flow, receivables decrease = positive cash flow
    receivablesRow.current = -receivablesChange;
    receivablesRow.previous = null; // This is a calculated change, not a historical comparison
  }

  const payablesRow = rows.find(r => r.description === "Changes in payables");
  if (payablesRow) {
    // Payables increase = positive cash flow, payables decrease = negative cash flow
    payablesRow.current = payablesChange;
    payablesRow.previous = null; // This is a calculated change, not a historical comparison
  }
}

export async function getCashFlowRows(
  facilityId: number,
  currentPeriodId: number,
  previousPeriodId: number | null,
): Promise<RowDTO[]> {
  // Load template
  const template = await db
    .select()
    .from(s.statementTemplates)
    .where(eq(s.statementTemplates.statementCode, "CASH_FLOW"))
    .orderBy(s.statementTemplates.displayOrder);

  const allEventIds = Array.from(new Set(template.flatMap(t => t.eventIds ?? [])));

  const cur = await loadAmounts(facilityId, currentPeriodId, allEventIds);
  const prev = previousPeriodId ? await loadAmounts(facilityId, previousPeriodId, allEventIds) : new Map();

  const rows: RowDTO[] = [];
  
  // Track revenues and expenses separately for operating activities
  let revenueCur = 0;
  let revenuePrev = 0;
  let expenseCur = 0;
  let expensePrev = 0;
  
  let runningSubtotalCur = 0;
  let runningSubtotalPrev = 0;
  let currentSection = "OPERATING"; // Track which section we're in

  for (const t of template) {
    let curVal: number | null = null;
    let prevVal: number | null = null;

    // Determine which section we're in based on line item
    if (t.lineItem.includes("INVESTING")) {
      currentSection = "INVESTING";
      runningSubtotalCur = 0;
      runningSubtotalPrev = 0;
    } else if (t.lineItem.includes("FINANCING")) {
      currentSection = "FINANCING";
      runningSubtotalCur = 0;
      runningSubtotalPrev = 0;
    }

    if ((t.eventIds?.length ?? 0) > 0) {
      curVal = t.eventIds.reduce((a, id) => a + (cur.get(id) ?? 0), 0);
      prevVal = t.eventIds.reduce((a, id) => a + (prev.get(id) ?? 0), 0);
      
      // For operating activities, separate revenue from expenses
      if (currentSection === "OPERATING") {
        if (t.lineItem.includes("EXPENSES") || t.lineItem.includes("Compensation") || 
            t.lineItem.includes("Goods and services") || t.lineItem.includes("Grants and transfers") || 
            t.lineItem.includes("Subsidies") || t.lineItem.includes("Social assistance") || 
            t.lineItem.includes("Finance costs") || t.lineItem.includes("Other expenses")) {
          console.log(`EXPENSE: ${t.lineItem} = ${curVal}`);
          expenseCur += curVal;
          expensePrev += prevVal;
        } else if (t.lineItem.includes("REVENUE") || t.lineItem.includes("Tax revenue") || 
                   t.lineItem.includes("Grants") || t.lineItem.includes("Transfers") || 
                   t.lineItem.includes("Property income") || t.lineItem.includes("Sales") || 
                   t.lineItem.includes("Other revenue") || t.lineItem.includes("Fines")) {
          console.log(`REVENUE: ${t.lineItem} = ${curVal}`);
          revenueCur += curVal;
          revenuePrev += prevVal;
        } else if (curVal !== null && curVal !== 0) {
          console.log(`UNMATCHED ITEM: ${t.lineItem} = ${curVal}`);
        }
      } else {
        // For investing and financing activities, use regular subtotal logic
        runningSubtotalCur += curVal;
        runningSubtotalPrev += prevVal;
      }
    }

    if (t.isSubtotalLine) {
      if (currentSection === "OPERATING") {
        // Don't update curVal/prevVal for operating subtotals - we'll handle them specially
        curVal = null;
        prevVal = null;
      } else {
        curVal = runningSubtotalCur;
        prevVal = runningSubtotalPrev;
        runningSubtotalCur = 0;
        runningSubtotalPrev = 0;
      }
    }

    if (t.isTotalLine) {
      if (t.lineItem === "Net cash flows from operating activities") {
        // Operating cash flow = Revenue - Expenses
        console.log(`CASH FLOW DEBUG: Revenue=${revenueCur}, Expenses=${expenseCur}, Result=${revenueCur - expenseCur}`);
        curVal = revenueCur - expenseCur;
        prevVal = revenuePrev - expensePrev;
        // Reset for next section
        revenueCur = 0;
        revenuePrev = 0;
        expenseCur = 0;
        expensePrev = 0;
      } else {
        curVal = runningSubtotalCur;
        prevVal = runningSubtotalPrev;
        runningSubtotalCur = 0;
        runningSubtotalPrev = 0;
      }
    }

    rows.push({
      description: t.lineItem,
      note: t.eventIds?.[0] ?? null,
      current: curVal,
      previous: prevVal,
      isTotal: Boolean(t.isTotalLine),
      isSubtotal: Boolean(t.isSubtotalLine),
    });
  }

  // Calculate working capital changes based on period-to-period differences
  await calculateWorkingCapitalChanges(rows, facilityId, currentPeriodId, previousPeriodId);

  // Additional totals
  const opRow = rows.find(r => r.description === "Net cash flows from operating activities");
  const invRow = rows.find(r => r.description === "Net cash flows from investing activities");
  const finRow = rows.find(r => r.description === "Net cash flows from financing activities");
  const netChangeRow = rows.find(r => r.description.startsWith("Net increase/decrease"));
  const beginCashRow = rows.find(r => r.description === "Cash and cash equivalents at beginning of period");
  const endCashRow = rows.find(r => r.description === "Cash and cash equivalents at end of period");
  const adjRow = rows.find(r => r.description === "Prior year adjustments");

  if (netChangeRow && opRow && invRow && finRow) {
    netChangeRow.current = (opRow.current ?? 0) + (invRow.current ?? 0) + (finRow.current ?? 0);
    netChangeRow.previous = (opRow.previous ?? 0) + (invRow.previous ?? 0) + (finRow.previous ?? 0);
  }

  if (endCashRow && beginCashRow && netChangeRow) {
    endCashRow.current = (beginCashRow.current ?? 0) + (netChangeRow.current ?? 0) + (adjRow?.current ?? 0);
    endCashRow.previous = (beginCashRow.previous ?? 0) + (netChangeRow.previous ?? 0) + (adjRow?.previous ?? 0);
  }

  return rows;
}

/** Helper: budget amounts by eventId */
async function loadBudgetAmounts(
  facilityId: number,
  periodId: number,
  eventIds: number[],
): Promise<AmountMap> {
  if (eventIds.length === 0) return new Map();

  // First, get the event ID for TRANSFERS_PUBLIC_ENTITIES
  const transfersEvent = await db
    .select({ id: s.events.id })
    .from(s.events)
    .where(eq(s.events.code, 'TRANSFERS_PUBLIC_ENTITIES'))
    .limit(1);

  const transfersEventId = transfersEvent[0]?.id;

  // Query planned amounts from financial_events where source_table = 'planning_data'
  const rows = await db
    .select({
      eventId: s.financialEvents.eventId,
      amount: sql<number>`SUM(${s.financialEvents.amount})`.as("amount"),
    })
    .from(s.financialEvents)
    .where(and(
      eq(s.financialEvents.facilityId, facilityId),
      eq(s.financialEvents.reportingPeriodId, periodId),
      inArray(s.financialEvents.eventId, eventIds),
      eq(s.financialEvents.sourceTable, 'planning_data')
    ))
    .groupBy(s.financialEvents.eventId);

  const budgetMap = new Map(rows.map(r => [r.eventId, Number(r.amount)]));

  // Special handling for TRANSFERS_PUBLIC_ENTITIES: Get planning totals directly
  if (transfersEventId && eventIds.includes(transfersEventId)) {
    try {
      // Query planning totals for this facility
      const planningTotals = await db
        .select({
          grandTotal: sql<number>`SUM(${s.planningData.totalBudget})`.as("grandTotal"),
        })
        .from(s.planningData)
        .where(eq(s.planningData.facilityId, facilityId))
        .groupBy(s.planningData.facilityId);

      if (planningTotals.length > 0) {
        const grandTotal = Number(planningTotals[0].grandTotal || 0);
        // Override the budget amount for TRANSFERS_PUBLIC_ENTITIES with planning totals
        budgetMap.set(transfersEventId, grandTotal);
      }
    } catch (error) {
      console.error(`Error fetching planning totals for facility ${facilityId}:`, error);
    }
  }

  return budgetMap;
}

/** Statement of Budget vs Actual */
export async function getBudgetVsActualRows(
  facilityId: number,
  periodId: number,
): Promise<RowDTO[]> {
  const template = await db
    .select()
    .from(s.statementTemplates)
    .where(eq(s.statementTemplates.statementCode, "BUDGET_VS_ACTUAL"))
    .orderBy(s.statementTemplates.displayOrder);

  const allEventIds = Array.from(new Set(template.flatMap(t => t.eventIds ?? [])));

  const actualMap = await loadAmounts(facilityId, periodId, allEventIds);
  const budgetMap = await loadBudgetAmounts(facilityId, periodId, allEventIds);

  const rows: RowDTO[] = [];
  let runningSubAct = 0;
  let runningSubBud = 0;
  let grandAct = 0;
  let grandBud = 0;

  for (const t of template) {
    let actual: number | null = null;
    let budget: number | null = null;

    if ((t.eventIds?.length ?? 0) > 0) {
      actual = t.eventIds.reduce((a, id) => a + (actualMap.get(id) ?? 0), 0);
      budget = t.eventIds.reduce((a, id) => a + (budgetMap.get(id) ?? 0), 0);
      grandAct += actual;
      grandBud += budget;
      runningSubAct += actual;
      runningSubBud += budget;
    }

    if (t.isSubtotalLine) {
      actual = runningSubAct;
      budget = runningSubBud;
      runningSubAct = 0;
      runningSubBud = 0;
    }

    if (t.isTotalLine) {
      actual = grandAct;
      budget = grandBud;
      runningSubAct = 0;
      runningSubBud = 0;
      grandAct = 0;
      grandBud = 0;
    }

    rows.push({
      description: t.lineItem,
      note: t.eventIds?.[0] ?? null,
      current: actual,  // actual
      previous: budget, // budget (planned)
      isTotal: Boolean(t.isTotalLine),
      isSubtotal: Boolean(t.isSubtotalLine),
    });
  }

  return rows;
}

/** Statement of Changes in Net Assets */
export async function getNetAssetsChangesRows(
  facilityId: number,
  periodId: number,
): Promise<RowDTO[]> {
  const template = await db
    .select()
    .from(s.statementTemplates)
    .where(eq(s.statementTemplates.statementCode, "NET_ASSETS_CHANGES"))
    .orderBy(s.statementTemplates.displayOrder);

  const allEventIds = Array.from(new Set(template.flatMap(t => t.eventIds ?? [])));

  const amountMap = await loadAmounts(facilityId, periodId, allEventIds);

  const rows: RowDTO[] = [];

  for (const t of template) {
    let cur: number | null = null;
    if ((t.eventIds?.length ?? 0) > 0) {
      cur = t.eventIds.reduce((a, id) => a + (amountMap.get(id) ?? 0), 0);
    }

    rows.push({
      description: t.lineItem,
      note: t.eventIds?.[0] ?? null,
      current: cur,
      previous: null,
      isTotal: Boolean(t.isTotalLine),
      isSubtotal: Boolean(t.isSubtotalLine),
    });
  }

  // If template contains a generic net surplus line without eventIds, derive from Rev/Exp
  const netRow = rows.find(r => r.description.toLowerCase().includes("surplus"));
  if (netRow && netRow.current === null) {
    const revExp = await getRevExpRows(facilityId, periodId, null);
    const surplusRow = revExp.find(r => r.description.includes("SURPLUS") || r.description.includes("DEFICIT"));
    if (surplusRow) {
      netRow.current = surplusRow.current;
    }
  }

  return rows;
}

// helper
async function listExecutedFacilities(periodId: number): Promise<number[]> {
  const rows = await db
    .selectDistinct({ id: s.financialEvents.facilityId })
    .from(s.financialEvents)
    .where(eq(s.financialEvents.reportingPeriodId, periodId));

  return rows
    .map(r => r.id)          // id is number | null
    .filter((id): id is number => typeof id === "number");  // remove nulls
}

export async function getRevExpAll(periodId: number) {
  const fids = await listExecutedFacilities(periodId);   // ← now clean

  return Promise.all(
    fids.map(async fid => ({
      facilityId: fid,
      rows: await getRevExpRows(fid, periodId, null),
    }))
  );
}

// -----------------------------------------------------------------------------
// Aggregated Revenue & Expenditure for all facilities in one period
// -----------------------------------------------------------------------------

export async function getRevExpAggregate(periodId: number): Promise<RowDTO[]> {
  // 1. Load template
  const template = await db
    .select()
    .from(s.statementTemplates)
    .where(eq(s.statementTemplates.statementCode, "REV_EXP"))
    .orderBy(s.statementTemplates.displayOrder);

  // 2. Gather distinct eventIds referenced
  const allEventIds = Array.from(new Set(template.flatMap(t => t.eventIds ?? [])));

  // 3. Load summed amounts for ALL facilities
  const cur = await loadAmountsAll(periodId, allEventIds);

  // 4. Walk template attaching current values (no previous)
  const rows: RowDTO[] = [];
  let runningSubtotal = 0;
  let grand = 0;

  for (const t of template) {
    let curVal: number | null = null;

    if ((t.eventIds?.length ?? 0) > 0) {
      curVal = t.eventIds.reduce((a, id) => a + (cur.get(id) ?? 0), 0);
      grand += curVal;
      runningSubtotal += curVal;
    }

    if (t.isSubtotalLine) {
      curVal = runningSubtotal;
      runningSubtotal = 0;
    }

    if (t.isTotalLine) {
      curVal = grand;
      runningSubtotal = 0;
      grand = 0;
    }

    rows.push({
      description: t.lineItem,
      note: t.eventIds?.[0] ?? null,
      current: curVal,
      previous: null,
      isTotal: Boolean(t.isTotalLine),
      isSubtotal: Boolean(t.isSubtotalLine),
    });
  }

  // Surplus / Deficit derivation
  const surplusRow = rows.find(r => r.description.includes("SURPLUS") || r.description.includes("DEFICIT"));
  if (surplusRow) {
    const totalRev = rows.find(r => r.description === "TOTAL REVENUE");
    const totalExp = rows.find(r => r.description === "TOTAL EXPENSES");
    if (totalRev && totalExp) {
      surplusRow.current = (totalRev.current ?? 0) - (totalExp.current ?? 0);
    }
  }

  return rows;
};

// -----------------------------------------------------------------------------
// Shared helpers for aggregate endpoints
// -----------------------------------------------------------------------------

async function loadBudgetAmountsAll(periodId: number, eventIds: number[]): Promise<AmountMap> {
  if (eventIds.length === 0) return new Map();

  // First, get the event ID for TRANSFERS_PUBLIC_ENTITIES
  const transfersEvent = await db
    .select({ id: s.events.id })
    .from(s.events)
    .where(eq(s.events.code, 'TRANSFERS_PUBLIC_ENTITIES'))
    .limit(1);

  const transfersEventId = transfersEvent[0]?.id;

  // Query planned amounts from financial_events where source_table = 'planning_data'
  const rows = await db
    .select({
      eventId: s.financialEvents.eventId,
      amount: sql<number>`SUM(${s.financialEvents.amount})`.as("amount"),
    })
    .from(s.financialEvents)
    .where(and(
      eq(s.financialEvents.reportingPeriodId, periodId),
      inArray(s.financialEvents.eventId, eventIds),
      eq(s.financialEvents.sourceTable, 'planning_data')
    ))
    .groupBy(s.financialEvents.eventId);

  const budgetMap = new Map(rows.map((r: { eventId: number; amount: number }) => [r.eventId, Number(r.amount)]));

  // Special handling for TRANSFERS_PUBLIC_ENTITIES: Get planning totals directly (aggregated across all facilities)
  if (transfersEventId && eventIds.includes(transfersEventId)) {
    try {
      // Query planning totals for ALL facilities (aggregate)
      const planningTotals = await db
        .select({
          grandTotal: sql<number>`SUM(${s.planningData.totalBudget})`.as("grandTotal"),
        })
        .from(s.planningData);

      if (planningTotals.length > 0) {
        const grandTotal = Number(planningTotals[0].grandTotal || 0);
        // Override the budget amount for TRANSFERS_PUBLIC_ENTITIES with planning totals
        budgetMap.set(transfersEventId, grandTotal);
      }
    } catch (error) {
      console.error(`Error fetching aggregate planning totals:`, error);
    }
  }

  return budgetMap;
}

// -----------------------------------------------------------------------------
// Aggregated Assets & Liabilities
// -----------------------------------------------------------------------------

export async function getAssetsLiabAggregate(periodId: number): Promise<RowDTO[]> {
  const template = await db
    .select()
    .from(s.statementTemplates)
    .where(eq(s.statementTemplates.statementCode, "ASSETS_LIAB"))
    .orderBy(s.statementTemplates.displayOrder);

  const allEventIds = Array.from(new Set(template.flatMap(t => t.eventIds ?? [])));
  const cur = await loadAmountsAll(periodId, allEventIds);

  const rows: RowDTO[] = [];
  let runningSubtotal = 0;
  let grand = 0;

  for (const t of template) {
    let curVal: number | null = null;

    if ((t.eventIds?.length ?? 0) > 0) {
      curVal = t.eventIds.reduce((a, id) => a + (cur.get(id) ?? 0), 0);
      grand += curVal;
      runningSubtotal += curVal;
    }

    if (t.isSubtotalLine) {
      curVal = runningSubtotal;
      runningSubtotal = 0;
    }

    if (t.isTotalLine) {
      curVal = grand;
      runningSubtotal = 0;
      grand = 0;
    }

    rows.push({
      description: t.lineItem,
      note: t.eventIds?.[0] ?? null,
      current: curVal,
      previous: null,
      isTotal: Boolean(t.isTotalLine),
      isSubtotal: Boolean(t.isSubtotalLine),
    });
  }

  // Calculate Surplus/Deficit for the period by getting aggregated revenue and expense data
  const surplusRow = rows.find(r => r.description.includes("Surplus/deficits of the period"));
  if (surplusRow) {
    // Get aggregated revenue and expense data for current period
    const revExpRowsAggregate = await getRevExpAggregate(periodId);
    const totalRevAggregate = revExpRowsAggregate.find(r => r.description === "TOTAL REVENUE");
    const totalExpAggregate = revExpRowsAggregate.find(r => r.description === "TOTAL EXPENSES");
    
    if (totalRevAggregate && totalExpAggregate) {
      surplusRow.current = (totalRevAggregate.current ?? 0) - (totalExpAggregate.current ?? 0);
    }
    // Note: Aggregate reports typically don't show previous period data
  }

  // Compute derived totals similar to per-facility function
  const totalCurrAssets    = rows.find(r => r.description === "Total current assets");
  const totalNonCurrAssets = rows.find(r => r.description === "Total non-current assets");
  const totalAssets        = rows.find(r => r.description === "Total assets (A)");

  const totalCurrLiab      = rows.find(r => r.description === "Total current liabilities");
  const totalNonCurrLiab   = rows.find(r => r.description === "Total non-current liabilities");
  const totalLiabilities   = rows.find(r => r.description === "Total liabilities (B)");

  if (totalAssets && totalCurrAssets && totalNonCurrAssets) {
    totalAssets.current = (totalCurrAssets.current ?? 0) + (totalNonCurrAssets.current ?? 0);
  }
  if (totalLiabilities && totalCurrLiab && totalNonCurrLiab) {
    totalLiabilities.current = (totalCurrLiab.current ?? 0) + (totalNonCurrLiab.current ?? 0);
  }

  const netAssets      = rows.find(r => r.description.startsWith("Net assets"));
  const totalNetAssets = rows.find(r => r.description === "Total Net Assets");

  if (netAssets && totalAssets && totalLiabilities) {
    netAssets.current = (totalAssets.current ?? 0) - (totalLiabilities.current ?? 0);
  }
  if (totalNetAssets && netAssets) {
    totalNetAssets.current = netAssets.current;
  }

  return rows;
}

// -----------------------------------------------------------------------------
// Aggregated Cash-Flow
// -----------------------------------------------------------------------------

/**
 * Calculate working capital changes for aggregate cash flow statement
 * For aggregate reports, we calculate changes across all facilities
 */
async function calculateWorkingCapitalChangesAggregate(
  rows: RowDTO[],
  currentPeriodId: number,
  previousPeriodId: number | null
): Promise<void> {
  if (!previousPeriodId) return;

  // Get receivables and payables event IDs
  const [receivablesEvents, payablesEvents] = await Promise.all([
    db.select({ id: s.events.id })
      .from(s.events)
      .where(inArray(s.events.code, ['RECEIVABLES_EXCHANGE', 'RECEIVABLES_NON_EXCHANGE'])),
    db.select({ id: s.events.id })
      .from(s.events)
      .where(eq(s.events.code, 'PAYABLES'))
  ]);

  const receivablesEventIds = receivablesEvents.map(e => e.id);
  const payablesEventIds = payablesEvents.map(e => e.id);

  // Load current and previous period amounts (aggregated across all facilities)
  const [curAmounts, prevAmounts] = await Promise.all([
    loadAmountsAll(currentPeriodId, [...receivablesEventIds, ...payablesEventIds]),
    loadAmountsAll(previousPeriodId, [...receivablesEventIds, ...payablesEventIds])
  ]);

  // Calculate receivables change (aggregated)
  const curReceivables = receivablesEventIds.reduce((sum, id) => sum + (curAmounts.get(id) ?? 0), 0);
  const prevReceivables = receivablesEventIds.reduce((sum, id) => sum + (prevAmounts.get(id) ?? 0), 0);
  const receivablesChange = curReceivables - prevReceivables;
  
  // Calculate payables change (aggregated)
  const curPayables = payablesEventIds.reduce((sum, id) => sum + (curAmounts.get(id) ?? 0), 0);
  const prevPayables = payablesEventIds.reduce((sum, id) => sum + (prevAmounts.get(id) ?? 0), 0);
  const payablesChange = curPayables - prevPayables;

  // Apply cash flow impact rules and update rows
  const receivablesRow = rows.find(r => r.description === "Changes in receivables");
  if (receivablesRow) {
    // Receivables increase = negative cash flow, receivables decrease = positive cash flow
    receivablesRow.current = -receivablesChange;
  }

  const payablesRow = rows.find(r => r.description === "Changes in payables");
  if (payablesRow) {
    // Payables increase = positive cash flow, payables decrease = negative cash flow
    payablesRow.current = payablesChange;
  }
}

export async function getCashFlowAggregate(periodId: number, previousPeriodId?: number | null): Promise<RowDTO[]> {
  const template = await db
    .select()
    .from(s.statementTemplates)
    .where(eq(s.statementTemplates.statementCode, "CASH_FLOW"))
    .orderBy(s.statementTemplates.displayOrder);

  const allEventIds = Array.from(new Set(template.flatMap(t => t.eventIds ?? [])));
  const cur = await loadAmountsAll(periodId, allEventIds);

  const rows: RowDTO[] = [];
  
  // Track revenues and expenses separately for operating activities
  let revenueCur = 0;
  let expenseCur = 0;
  
  let runningSubtotal = 0;
  let currentSection = "OPERATING"; // Track which section we're in

  for (const t of template) {
    let curVal: number | null = null;

    // Determine which section we're in based on line item
    if (t.lineItem.includes("INVESTING")) {
      currentSection = "INVESTING";
      runningSubtotal = 0;
    } else if (t.lineItem.includes("FINANCING")) {
      currentSection = "FINANCING";
      runningSubtotal = 0;
    }

    if ((t.eventIds?.length ?? 0) > 0) {
      curVal = t.eventIds.reduce((a, id) => a + (cur.get(id) ?? 0), 0);
      
      // For operating activities, separate revenue from expenses
      if (currentSection === "OPERATING") {
        if (t.lineItem.includes("EXPENSES") || t.lineItem.includes("Compensation") || 
            t.lineItem.includes("Goods and services") || t.lineItem.includes("Grants and transfers") || 
            t.lineItem.includes("Subsidies") || t.lineItem.includes("Social assistance") || 
            t.lineItem.includes("Finance costs") || t.lineItem.includes("Other expenses")) {
          console.log(`AGG EXPENSE: ${t.lineItem} = ${curVal}`);
          expenseCur += curVal;
        } else if (t.lineItem.includes("REVENUE") || t.lineItem.includes("Tax revenue") || 
                   t.lineItem.includes("Grants") || t.lineItem.includes("Transfers") || 
                   t.lineItem.includes("Property income") || t.lineItem.includes("Sales") || 
                   t.lineItem.includes("Other revenue") || t.lineItem.includes("Fines")) {
          console.log(`AGG REVENUE: ${t.lineItem} = ${curVal}`);
          revenueCur += curVal;
        } else if (curVal !== null && curVal !== 0) {
          console.log(`AGG UNMATCHED ITEM: ${t.lineItem} = ${curVal}`);
        }
      } else {
        // For investing and financing activities, use regular subtotal logic
        runningSubtotal += curVal;
      }
    }

    if (t.isSubtotalLine) {
      if (currentSection === "OPERATING") {
        // Don't update curVal for operating subtotals - we'll handle them specially
        curVal = null;
      } else {
        curVal = runningSubtotal;
        runningSubtotal = 0;
      }
    }

    if (t.isTotalLine) {
      if (t.lineItem === "Net cash flows from operating activities") {
        // Operating cash flow = Revenue - Expenses
        console.log(`AGGREGATE CASH FLOW DEBUG: Revenue=${revenueCur}, Expenses=${expenseCur}, Result=${revenueCur - expenseCur}`);
        curVal = revenueCur - expenseCur;
        // Reset for next section
        revenueCur = 0;
        expenseCur = 0;
      } else {
        curVal = runningSubtotal;
        runningSubtotal = 0;
      }
    }

    rows.push({
      description: t.lineItem,
      note: t.eventIds?.[0] ?? null,
      current: curVal,
      previous: null,
      isTotal: Boolean(t.isTotalLine),
      isSubtotal: Boolean(t.isSubtotalLine),
    });
  }

  // Calculate working capital changes for aggregate report
  await calculateWorkingCapitalChangesAggregate(rows, periodId, previousPeriodId ?? null);

  // Totals same as per-facility logic
  const opRow = rows.find(r => r.description === "Net cash flows from operating activities");
  const invRow = rows.find(r => r.description === "Net cash flows from investing activities");
  const finRow = rows.find(r => r.description === "Net cash flows from financing activities");
  const netChangeRow = rows.find(r => r.description.startsWith("Net increase/decrease"));
  const beginCashRow = rows.find(r => r.description === "Cash and cash equivalents at beginning of period");
  const endCashRow = rows.find(r => r.description === "Cash and cash equivalents at end of period");
  const adjRow = rows.find(r => r.description === "Prior year adjustments");

  if (netChangeRow && opRow && invRow && finRow) {
    netChangeRow.current = (opRow.current ?? 0) + (invRow.current ?? 0) + (finRow.current ?? 0);
  }

  if (endCashRow && beginCashRow && netChangeRow) {
    endCashRow.current = (beginCashRow.current ?? 0) + (netChangeRow.current ?? 0) + (adjRow?.current ?? 0);
  }

  return rows;
}

// -----------------------------------------------------------------------------
// Aggregated Budget vs Actual
// -----------------------------------------------------------------------------

export async function getBudgetVsActualAggregate(periodId: number): Promise<RowDTO[]> {
  const template = await db
    .select()
    .from(s.statementTemplates)
    .where(eq(s.statementTemplates.statementCode, "BUDGET_VS_ACTUAL"))
    .orderBy(s.statementTemplates.displayOrder);

  const allEventIds = Array.from(new Set(template.flatMap(t => t.eventIds ?? [])));

  const actualMap = await loadAmountsAll(periodId, allEventIds);
  const budgetMap = await loadBudgetAmountsAll(periodId, allEventIds);

  const rows: RowDTO[] = [];
  let runningSubAct = 0;
  let runningSubBud = 0;
  let grandAct = 0;
  let grandBud = 0;

  for (const t of template) {
    let actual: number | null = null;
    let budget: number | null = null;

    if ((t.eventIds?.length ?? 0) > 0) {
      actual = t.eventIds.reduce((a, id) => a + (actualMap.get(id) ?? 0), 0);
      budget = t.eventIds.reduce((a, id) => a + (budgetMap.get(id) ?? 0), 0);
      grandAct += actual;
      grandBud += budget;
      runningSubAct += actual;
      runningSubBud += budget;
    }

    if (t.isSubtotalLine) {
      actual = runningSubAct;
      budget = runningSubBud;
      runningSubAct = 0;
      runningSubBud = 0;
    }

    if (t.isTotalLine) {
      actual = grandAct;
      budget = grandBud;
      runningSubAct = 0;
      runningSubBud = 0;
      grandAct = 0;
      grandBud = 0;
    }

    rows.push({
      description: t.lineItem,
      note: t.eventIds?.[0] ?? null,
      current: actual,
      previous: budget,
      isTotal: Boolean(t.isTotalLine),
      isSubtotal: Boolean(t.isSubtotalLine),
    });
  }

  return rows;
}

// -----------------------------------------------------------------------------
// Aggregated Net Assets Changes
// -----------------------------------------------------------------------------

export async function getNetAssetsChangesAggregate(periodId: number): Promise<RowDTO[]> {
  const template = await db
    .select()
    .from(s.statementTemplates)
    .where(eq(s.statementTemplates.statementCode, "NET_ASSETS_CHANGES"))
    .orderBy(s.statementTemplates.displayOrder);

  const allEventIds = Array.from(new Set(template.flatMap(t => t.eventIds ?? [])));

  const amountMap = await loadAmountsAll(periodId, allEventIds);

  const rows: RowDTO[] = [];

  for (const t of template) {
    let cur: number | null = null;
    if ((t.eventIds?.length ?? 0) > 0) {
      cur = t.eventIds.reduce((a, id) => a + (amountMap.get(id) ?? 0), 0);
    }

    rows.push({
      description: t.lineItem,
      note: t.eventIds?.[0] ?? null,
      current: cur,
      previous: null,
      isTotal: Boolean(t.isTotalLine),
      isSubtotal: Boolean(t.isSubtotalLine),
    });
  }

  // derive surplus/deficit if needed
  const netRow = rows.find(r => r.description.toLowerCase().includes("surplus"));
  if (netRow && netRow.current === null) {
    const revExp = await getRevExpAggregate(periodId);
    const surplusRow = revExp.find(r => r.description.includes("SURPLUS") || r.description.includes("DEFICIT"));
    if (surplusRow) netRow.current = surplusRow.current;
  }

  return rows;
}


