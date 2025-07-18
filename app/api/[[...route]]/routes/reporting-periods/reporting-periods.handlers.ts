import db from "@/db";
import * as schema from "@/db/schema";
import { and, desc, eq, gte, lte } from "drizzle-orm";

import type { AppRouteHandler } from "../../lib/types";
import type {
  ListReportingPeriodsRoute,
  CreateReportingPeriodRoute,
  GetReportingPeriodByIdRoute,
  ListActiveReportingPeriodsRoute,
  GetCurrentReportingPeriodRoute,
} from "./reporting-periods.routes";
import * as HttpStatusCodes from "stoker/http-status-codes";

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

export const listReportingPeriods: AppRouteHandler<ListReportingPeriodsRoute> = async (
  c
) => {
  // try {
    const data = await db.query.reportingPeriods.findMany({
      orderBy: desc(schema.reportingPeriods.year),
    });
    return c.json({ data }, HttpStatusCodes.OK);
  // } catch (error) {
  //   c.get("logger").error("Error listing reporting periods:", error);
  //   return c.json(
  //     {
  //       error: "INTERNAL_ERROR",
  //       message: "Failed to retrieve reporting periods",
  //     },
  //     500
  //   );
  // }
};

export const createReportingPeriod: AppRouteHandler<CreateReportingPeriodRoute> = async (
  c
) => {
  try {
    const body = c.req.valid("json");
    const [newPeriod] = await db
      .insert(schema.reportingPeriods)
      .values(body)
      .returning();
    return c.json(newPeriod, 201);
  } catch (error) {
    c.get("logger").error("Error creating reporting period:", error);
    return c.json(
      {
        error: "INTERNAL_ERROR",
        message: "Failed to create reporting period",
      },
      500
    );
  }
};

export const getReportingPeriodById: AppRouteHandler<
  GetReportingPeriodByIdRoute
> = async (c) => {
  const { id } = c.req.valid("param");
  const data = await db.query.reportingPeriods.findFirst({
    where: eq(schema.reportingPeriods.id, id),
  });

  if (!data) {
    return c.json(
      {
        error: "NOT_FOUND",
        message: "Reporting period not found",
      },
      HttpStatusCodes.NOT_FOUND
    );
  }

  return c.json(data, HttpStatusCodes.OK);
};

export const listActiveReportingPeriods: AppRouteHandler<
  ListActiveReportingPeriodsRoute
> = async (c) => {
  const data = await db.query.reportingPeriods.findFirst({
    where: eq(schema.reportingPeriods.status, "ACTIVE"),
    orderBy: [
      desc(schema.reportingPeriods.year),
      desc(schema.reportingPeriods.startDate),
    ],
  });
  if (!data) {
    return c.json(
      {
        error: "NOT_FOUND",
        message: "No active reporting period found",
      },
      HttpStatusCodes.NOT_FOUND
    );
  }
  return c.json({ data }, HttpStatusCodes.OK);
};

export const getCurrentReportingPeriod: AppRouteHandler<
  GetCurrentReportingPeriodRoute
> = async (c) => {
  const now = new Date();
  const data = await db.query.reportingPeriods.findFirst({
    where: and(
      eq(schema.reportingPeriods.status, "ACTIVE"),
      lte(schema.reportingPeriods.startDate, now.toISOString()),
      gte(schema.reportingPeriods.endDate, now.toISOString())
    ),
  });

  if (!data) {
    return c.json(
      {
        error: "NOT_FOUND",
        message: "No current active reporting period found",
      },
      HttpStatusCodes.NOT_FOUND
    );
  }

  return c.json(data, HttpStatusCodes.OK);
};
