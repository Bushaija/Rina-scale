import db from "@/db";
import * as schema from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";

import type { AppRouteHandler } from "../../lib/types";
import type {
  FinancialSummaryRoute,
  VarianceAnalysisRoute,
  FacilityComparisonRoute,
} from "./reports.routes";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { HTTPException } from "hono/http-exception";

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

export const generateFinancialSummary: AppRouteHandler<FinancialSummaryRoute> = async (
  c
) => {
  try {
    const query = c.req.valid("query");

    const reportingPeriod = await db.query.reportingPeriods.findFirst({
      where: eq(schema.reportingPeriods.id, query.reportingPeriodId),
    });

    if (!reportingPeriod) {
      return c.json(
        { error: "NOT_FOUND", message: "Reporting period not found" },
        HttpStatusCodes.NOT_FOUND
      );
    }

    let facility: any = null;
    if (query.facilityId) {
      facility = await db.query.facilities.findFirst({
        where: eq(schema.facilities.id, query.facilityId),
      });
    }

    const whereConditions = [
      eq(schema.executionData.reportingPeriodId, query.reportingPeriodId),
    ];

    const executionDataResults = await db.query.executionData.findMany({
      where: and(...whereConditions),
      with: {
        activity: {
          with: {
            category: true,
            subCategory: true,
          },
        },
      },
      orderBy: desc(schema.executionData.id),
    });

    const categoriesMap: Map<string, any> = new Map();

    for (const item of executionDataResults) {
      if (!item.activity?.category) continue;

      const category = item.activity.category;
      const subCategory = item.activity.subCategory;

      if (!categoriesMap.has(category.code)) {
        categoriesMap.set(category.code, {
          categoryCode: category.code,
          categoryName: category.name,
          subCategories: new Map<string, any>(),
          directActivities: [],
        });
      }

      const categoryData = categoriesMap.get(category.code);

      if (subCategory) {
        if (!categoryData.subCategories.has(subCategory.code)) {
          categoryData.subCategories.set(subCategory.code, {
            code: subCategory.code,
            name: subCategory.name,
            activities: [],
          });
        }

        categoryData.subCategories.get(subCategory.code).activities.push({
          id: item.activity.id,
          name: item.activity.name,
          isTotalRow: item.activity.isTotalRow ?? false,
          q1Amount: item.q1Amount,
          q2Amount: item.q2Amount,
          q3Amount: item.q3Amount,
          q4Amount: item.q4Amount,
          cumulativeBalance: item.cumulativeBalance,
        });
      } else {
        categoryData.directActivities.push({
          id: item.activity.id,
          name: item.activity.name,
          isTotalRow: item.activity.isTotalRow ?? false,
          q1Amount: item.q1Amount,
          q2Amount: item.q2Amount,
          q3Amount: item.q3Amount,
          q4Amount: item.q4Amount,
          cumulativeBalance: item.cumulativeBalance,
        });
      }
    }

    const categories = Array.from(categoriesMap.values()).map((cat) => ({
      ...cat,
      subCategories: Array.from(cat.subCategories.values()),
    }));

    const totals = executionDataResults.reduce(
      (acc, item) => {
        acc.q1Total += parseFloat(item.q1Amount || "0");
        acc.q2Total += parseFloat(item.q2Amount || "0");
        acc.q3Total += parseFloat(item.q3Amount || "0");
        acc.q4Total += parseFloat(item.q4Amount || "0");
        acc.cumulativeTotal += parseFloat(item.cumulativeBalance || "0");
        return acc;
      },
      {
        q1Total: 0,
        q2Total: 0,
        q3Total: 0,
        q4Total: 0,
        cumulativeTotal: 0,
      }
    );

    const reportingPeriodDto = {
      id: reportingPeriod.id,
      year: reportingPeriod.year,
      periodType: reportingPeriod.periodType ?? "UNKNOWN",
      startDate: reportingPeriod.startDate,
      endDate: reportingPeriod.endDate,
    };

    let facilityDto: { id: number; name: string; facilityType: string } | undefined;
    if (facility) {
      facilityDto = {
        id: facility.id,
        name: facility.name,
        facilityType: facility.facilityType,
      };
    }

    return c.json({
      reportingPeriod: reportingPeriodDto,
      facility: facilityDto,
      categories,
      totals: {
        q1Total: totals.q1Total.toFixed(2),
        q2Total: totals.q2Total.toFixed(2),
        q3Total: totals.q3Total.toFixed(2),
        q4Total: totals.q4Total.toFixed(2),
        cumulativeTotal: totals.cumulativeTotal.toFixed(2),
      },
      generatedAt: new Date().toISOString(),
    }, HttpStatusCodes.OK);
  } catch (error) {
    c.get("logger").error("Error generating financial summary:", error);
    return c.json(
      {
        error: "INTERNAL_ERROR",
        message: "Failed to generate financial summary",
      },
      HttpStatusCodes.INTERNAL_SERVER_ERROR
    );
  }
};

export const generateVarianceAnalysis: AppRouteHandler<VarianceAnalysisRoute> = async (
  c
) => {
  try {
    const query = c.req.valid("query");
    const emptyAnalysis: {
      activityName: string;
      categoryName: string;
      budgetAmount: string;
      actualAmount: string;
      variance: string;
      variancePercentage: number;
    }[] = [];
    return c.json({
      reportingPeriod: {
        id: query.reportingPeriodId,
        year: 2024,
        periodType: "ANNUAL",
      },
      analysis: emptyAnalysis,
    }, HttpStatusCodes.OK);
  } catch (error) {
    c.get("logger").error("Error generating variance analysis:", error);
    throw new HTTPException(HttpStatusCodes.INTERNAL_SERVER_ERROR, {
      message: "Failed to generate variance analysis",
    });
  }
};

export const generateFacilityComparison: AppRouteHandler<FacilityComparisonRoute> = async (
  c
) => {
  try {
    const query = c.req.valid("query");

    const executionData = await db.query.executionData.findMany({
      where: and(
        eq(schema.executionData.reportingPeriodId, query.reportingPeriodId)
      ),
      with: {
        activity: {
          with: {
            category: true,
          },
        },
      },
    });

    const comparison = (query.facilityIds as number[]).map((facilityId) => ({
      facilityName: `Facility ${facilityId}`,
      categoryBreakdown: executionData
        .filter((item) =>
          query.categoryCode
            ? item.activity?.category?.code === query.categoryCode
            : true
        )
        .map((item) => ({
          categoryCode: item.activity?.category?.code || "",
          categoryName: item.activity?.category?.name || "",
          totalAmount: item.cumulativeBalance || "0",
        })),
      grandTotal: executionData
        .reduce(
          (sum, item) => sum + parseFloat(item.cumulativeBalance || "0"),
          0
        )
        .toFixed(2),
    }));

    return c.json({
      comparison,
      reportingPeriodId: query.reportingPeriodId,
      facilityIds: query.facilityIds,
      categoryCode: query.categoryCode,
    }, HttpStatusCodes.OK);
  } catch (error) {
    c.get("logger").error("Error generating facility comparison:", error);
    throw new HTTPException(HttpStatusCodes.INTERNAL_SERVER_ERROR, {
      message: "Failed to generate facility comparison",
    });
  }
};
