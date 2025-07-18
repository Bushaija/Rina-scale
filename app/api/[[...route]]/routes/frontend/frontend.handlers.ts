import db from "@/db";
import * as schema from "@/db/schema";
import { eq, desc, max, isNotNull, asc, count, sum, and, or, isNull } from "drizzle-orm";

import type { AppRouteHandler } from "../../lib/types";
import type {
  GetFacilityUpdateInfoRoute,
  GetProjectExecutionDataRoute,
  PostExecutionDataRoute,
  GetExecutedFacilitiesRoute,
} from "./frontend.routes";
import * as HttpStatusCodes from "stoker/http-status-codes";

import { INSERT_EXECUTION_DATA_SQL } from "@/queries/insert-execution-data";

// Helper function to create string IDs based on category, subcategory, and display order
function createActivityStringId(
  categoryCode: string, 
  subCategoryCode: string | null, 
  displayOrder: number, 
  activityName: string
): string {
  // For category G activities, map to G1, G2, G3 based on display order
  if (categoryCode === 'G') {
    return `G${displayOrder}`;
  }
  
  // For activities under subcategories (like B01-1, B01-2)
  if (subCategoryCode) {
    return `${subCategoryCode}-${displayOrder}`;
  }
  
  // For activities directly under categories (like A1, A2, D1, D2)
  return `${categoryCode}${displayOrder}`;
}

export const getFacilityUpdateInfo: AppRouteHandler<
  GetFacilityUpdateInfoRoute
> = async (c) => {
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
      id: schema.facilities.id,
      facilityName: schema.facilities.name,
      facilityType: schema.facilities.facilityType,
      districtName: schema.districts.name,
      dateModified: max(schema.executionData.updatedAt),
      projectCode: schema.projects.code,
    })
    .from(schema.facilities)
    .innerJoin(
      schema.districts,
      eq(schema.facilities.districtId, schema.districts.id)
    )
    .innerJoin(
      schema.executionData,
      eq(schema.facilities.id, schema.executionData.facilityId)
    )
    .innerJoin(
      schema.projects,
      eq(schema.executionData.projectId, schema.projects.id)
    )
    .where(
      and(
        isNotNull(schema.executionData.updatedAt),
        eq(schema.facilities.districtId, userFacility.districtId) // Filter by user's district
      )
    )
    .groupBy(
      schema.facilities.id,
      schema.facilities.name,
      schema.facilities.facilityType,
      schema.districts.name,
      schema.projects.code
    )
    .orderBy(desc(max(schema.executionData.updatedAt)));

  return c.json({ data }, HttpStatusCodes.OK);
};

export const getProjectExecutionData: AppRouteHandler<GetProjectExecutionDataRoute> = async (c) => {
  const { facilityId } = c.req.valid("param");
  const user = c.get("user");

  // Authorization check: ensure user can only access data for facilities in their district
  if (!user?.facilityId) {
    return c.json({ error: "User facility not found" }, HttpStatusCodes.UNAUTHORIZED);
  }

  // Get user's facility and district
  const userFacility = await db.query.facilities.findFirst({
    where: eq(schema.facilities.id, user.facilityId),
    columns: { districtId: true }
  });

  if (!userFacility) {
    return c.json({ error: "User facility not found" }, HttpStatusCodes.UNAUTHORIZED);
  }

  // Get requested facility's district
  const requestedFacility = await db.query.facilities.findFirst({
    where: eq(schema.facilities.id, facilityId),
    columns: { districtId: true }
  });

  if (!requestedFacility) {
    return c.json({ error: "Requested facility not found" }, HttpStatusCodes.NOT_FOUND);
  }

  // Check if both facilities are in the same district
  if (userFacility.districtId !== requestedFacility.districtId) {
    return c.json({ 
      error: "Access denied", 
      message: "You can only access data for facilities in your district" 
    }, HttpStatusCodes.FORBIDDEN);
  }

  // Find the latest reporting period that has execution data for this facility
  const latestPeriod = await db
    .select({ 
      reportingPeriodId: max(schema.executionData.reportingPeriodId),
      projectId: schema.executionData.projectId
    })
    .from(schema.executionData)
    .where(eq(schema.executionData.facilityId, facilityId))
    .groupBy(schema.executionData.projectId);

  const reportingPeriodId = latestPeriod[0]?.reportingPeriodId;
  const projectId = latestPeriod[0]?.projectId;

  if (!reportingPeriodId || !projectId) {
    return c.json({ tableData: [] }, HttpStatusCodes.OK);
  }

  const rows = await db
    .select({
      categoryId: schema.categories.id,
      categoryCode: schema.categories.code,
      categoryName: schema.categories.name,
      categoryOrder: schema.categories.displayOrder,
      subCategoryId: schema.subCategories.id,
      subCategoryCode: schema.subCategories.code,
      subCategoryName: schema.subCategories.name,
      subCategoryOrder: schema.subCategories.displayOrder,
      activityId: schema.activities.id,
      activityName: schema.activities.name,
      activityOrder: schema.activities.displayOrder,
      isTotalRow: schema.activities.isTotalRow,
      q1Amount: schema.executionData.q1Amount,
      q2Amount: schema.executionData.q2Amount,
      q3Amount: schema.executionData.q3Amount,
      q4Amount: schema.executionData.q4Amount,
      cumulativeBalance: schema.executionData.cumulativeBalance,
      comment: schema.executionData.comment,
      executionId: schema.executionData.id,
      projectId: schema.executionData.projectId,
    })
    .from(schema.categories)
    .leftJoin(schema.subCategories, 
      and(
        eq(schema.subCategories.categoryId, schema.categories.id),
        eq(schema.subCategories.projectId, projectId!)
      )
    )
    .leftJoin(
      schema.activities,
      or(
        // Direct category activities (no subcategory)
        and(
          eq(schema.activities.categoryId, schema.categories.id),
          isNull(schema.activities.subCategoryId),
          eq(schema.activities.projectId, projectId!)
        ),
        // Subcategory activities
        and(
          eq(schema.activities.subCategoryId, schema.subCategories.id),
          isNull(schema.activities.categoryId),
          eq(schema.activities.projectId, projectId!)
        )
      )
    )
    .leftJoin(
      schema.executionData,
      and(
        eq(schema.executionData.activityId, schema.activities.id),
        eq(schema.executionData.facilityId, facilityId),
        eq(schema.executionData.reportingPeriodId, reportingPeriodId)
      )
    )
    .where(eq(schema.categories.projectId, projectId!))
    .orderBy(
      asc(schema.categories.displayOrder),
      asc(schema.subCategories.displayOrder),
      asc(schema.activities.displayOrder)
    );

  function buildTree(rs: typeof rows) {
    const categories: Record<number, any> = {};
    for (const r of rs) {
      let cat = categories[r.categoryId];
      if (!cat) {
        cat = categories[r.categoryId] = {
          id: r.categoryCode,
          title: `${r.categoryCode}. ${r.categoryName}`,
          isCategory: true,
          children: [],
          order: r.categoryOrder,
        };
      }
      let parent = cat;
      if (r.subCategoryId) {
        let sub = parent.children.find((c: any) => c.id === r.subCategoryCode);
        if (!sub) {
          sub = {
            id: r.subCategoryCode,
            title: `${r.subCategoryCode}. ${r.subCategoryName}`,
            isCategory: true,
            children: [],
            order: r.subCategoryOrder,
          };
          parent.children.push(sub);
          parent.children.sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0));
        }
        parent = sub;
      }
      if (r.activityId) {
        // Create a proper string ID based on category, subcategory, and display order
        const activityStringId = createActivityStringId(
          r.categoryCode, 
          r.subCategoryCode, 
          r.activityOrder || 0, 
          r.activityName || 'Unknown'
        );
        
        parent.children.push({
          id: activityStringId,
          executionId: r.executionId,
          title: r.activityName,
          isTotalRow: r.isTotalRow,
          q1: r.q1Amount,
          q2: r.q2Amount,
          q3: r.q3Amount,
          q4: r.q4Amount,
          cumulativeBalance: r.cumulativeBalance,
          comment: r.comment,
          order: r.activityOrder,
          // Keep the original numeric ID for backend operations
          activityId: r.activityId,
        });
        parent.children.sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0));
      }
    }

    // Helper to convert amount to number safely
    const toNum = (v: any) => (v !== null && v !== undefined ? parseFloat(v) : 0);

    // Recursive total computation
    const computeTotals = (node: any): { q1: number; q2: number; q3: number; q4: number } => {
      if (!node.children || node.children.length === 0) {
        return {
          q1: toNum(node.q1),
          q2: toNum(node.q2),
          q3: toNum(node.q3),
          q4: toNum(node.q4),
        };
      }

      let sum = { q1: 0, q2: 0, q3: 0, q4: 0 };
      for (const child of node.children) {
        const childSum = computeTotals(child);
        sum.q1 += childSum.q1;
        sum.q2 += childSum.q2;
        sum.q3 += childSum.q3;
        sum.q4 += childSum.q4;
      }

      // Assign totals directly to the category / sub-category node so the UI
      // shows them in the header row instead of a separate "total" child row.
      node.q1 = sum.q1.toFixed(2);
      node.q2 = sum.q2.toFixed(2);
      node.q3 = sum.q3.toFixed(2);
      node.q4 = sum.q4.toFixed(2);
      node.cumulativeBalance = (sum.q1 + sum.q2 + sum.q3 + sum.q4).toFixed(2);

      // Remove any existing total rows so the client only receives the header row with totals.
      if (Array.isArray(node.children)) {
        node.children = node.children.filter((c: any) => !c.isTotalRow);
      }

      return sum;
    };

    // Compute totals for every top-level category
    const catsArray = Object.values(categories).sort((a: any, b: any) => a.order - b.order);
    const sums = new Map<string, { q1:number; q2:number; q3:number; q4:number }>();
    catsArray.forEach(cat => sums.set(cat.id, computeTotals(cat)));

    const catC = catsArray.find(c => c.id === "C");
    if (catC) {
      const a = sums.get("A")!;
      const b = sums.get("B")!;
      const diff = { q1: a.q1 - b.q1, q2: a.q2 - b.q2, q3: a.q3 - b.q3, q4: a.q4 - b.q4 };

      // Set the calculated values directly on Category C itself, not as a child
      catC.q1 = diff.q1.toFixed(2);
      catC.q2 = diff.q2.toFixed(2);
      catC.q3 = diff.q3.toFixed(2);
      catC.q4 = diff.q4.toFixed(2);
      catC.cumulativeBalance = (diff.q1 + diff.q2 + diff.q3 + diff.q4).toFixed(2);
      
      // Ensure Category C has no children since it's a calculated category
      catC.children = [];
    }

    // Find category G and update G3 with category C values
    const catG = catsArray.find(c => c.id === "G");
    if (catG && catC) {
      const g3Activity = catG.children.find((child: any) => child.id === "G3");
      if (g3Activity) {
        g3Activity.q1 = catC.q1;
        g3Activity.q2 = catC.q2;
        g3Activity.q3 = catC.q3;
        g3Activity.q4 = catC.q4;
        g3Activity.cumulativeBalance = catC.cumulativeBalance;
        g3Activity.isEditable = false;
        g3Activity.isCalculated = true;
      }
    }

    const catD = catsArray.find((c: any) => c.id === "D");
    const catE = catsArray.find((c: any) => c.id === "E");
    const catF = catsArray.find((c: any) => c.id === "F");

    if (catD && catE && catF) {
      // Since totals are now stored directly on the category nodes, use them.
      const diff = {
        q1: toNum(catD.q1) - toNum(catE.q1),
        q2: toNum(catD.q2) - toNum(catE.q2),
        q3: toNum(catD.q3) - toNum(catE.q3),
        q4: toNum(catD.q4) - toNum(catE.q4),
      };

      catF.q1 = diff.q1.toFixed(2);
      catF.q2 = diff.q2.toFixed(2);
      catF.q3 = diff.q3.toFixed(2);
      catF.q4 = diff.q4.toFixed(2);
      catF.cumulativeBalance = (
        diff.q1 + diff.q2 + diff.q3 + diff.q4
      ).toFixed(2);

      // Ensure no lingering total rows remain inside F.
      if (Array.isArray(catF.children)) {
        catF.children = catF.children.filter((c: any) => !c.isTotalRow);
      }
    }

    return catsArray;
  }

  const tableData = buildTree(rows);
  
  // Get metadata from the first row with execution data
  const firstRowWithExecution = rows.find(row => row.executionId !== null);
  const metadata = firstRowWithExecution ? {
    reportingPeriodId: reportingPeriodId,
    projectId: firstRowWithExecution.projectId,
    facilityId: facilityId
  } : null;
  
  return c.json({ tableData, metadata }, HttpStatusCodes.OK);
};

export const listExecutedFacilities: AppRouteHandler<
  GetExecutedFacilitiesRoute
> = async (c) => {
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

  const rawData = await db
    .select({
      id: schema.facilities.id,
      name: schema.facilities.name,
      facilityType: schema.facilities.facilityType,
      districtName: schema.districts.name,
      executionRows: count(schema.executionData.id),
      totalExecutedAmount: sum(schema.executionData.cumulativeBalance),
      lastExecutedAt: max(schema.executionData.updatedAt),
      projectCode: schema.projects.code,
    })
    .from(schema.facilities)
    .innerJoin(
      schema.executionData,
      eq(schema.facilities.id, schema.executionData.facilityId)
    )
    .leftJoin(
      schema.districts,
      eq(schema.facilities.districtId, schema.districts.id)
    )
    .innerJoin(
      schema.projects,
      eq(schema.executionData.projectId, schema.projects.id)
    )
    .where(
      eq(schema.facilities.districtId, userFacility.districtId) // Filter by user's district
    )
    .groupBy(
      schema.facilities.id,
      schema.facilities.name,
      schema.facilities.facilityType,
      schema.districts.name,
      schema.projects.code
    )
    .orderBy(desc(sum(schema.executionData.cumulativeBalance)));

  const data = rawData.map((d) => ({
    ...d,
    totalExecutedAmount: d.totalExecutedAmount
      ? parseFloat(d.totalExecutedAmount)
      : null,
    lastExecutedAt: d.lastExecutedAt ? new Date(d.lastExecutedAt) : null,
    projectCode: d.projectCode,
  }));

  return c.json({ data }, HttpStatusCodes.OK);
};

// ------------------------------
// POST /frontend/execution-data
// ------------------------------

export const postExecutionData: AppRouteHandler<PostExecutionDataRoute> = async (c) => {
  const { facilityId, reportingPeriodId } = c.req.valid("param");
  const report = await c.req.json();

  await (db as any).execute(INSERT_EXECUTION_DATA_SQL, [
    report,
    facilityId,
    reportingPeriodId,
  ]);

  // TODO: track real counts later
  return c.json({ inserted: 0, updated: 0 });
};
