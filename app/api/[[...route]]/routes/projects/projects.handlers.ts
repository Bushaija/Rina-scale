import db from "@/db";
import * as schema from "@/db/schema";
import { desc, eq, and } from "drizzle-orm";

import type { AppRouteHandler } from "../../lib/types";
import type {
  ListProjectsRoute,
  CreateProjectRoute,
  ListUserProjectsRoute,
  CheckProjectExistsRoute,
  UpdateProjectStatusRoute,
  GetProjectRoute,
} from "./projects.routes";
import * as HttpStatusCodes from "stoker/http-status-codes";

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

// Helper to shape DB row into ProjectResponseSchema
const mapProject = (p: any) => ({
  id: p.id,
  name: p.name,
  code: p.code,
  status: p.status,
  facilityId: p.facilityId ?? null,
  reportingPeriodId: p.reportingPeriodId ?? null,
  userId: p.userId ?? null,
  createdAt: p.createdAt,
  updatedAt: p.updatedAt,
  facility: p.facility ? {
    id: p.facility.id,
    name: p.facility.name,
    facilityType: p.facility.facilityType,
  } : null,
  reportingPeriod: p.reportingPeriod ? {
    id: p.reportingPeriod.id,
    year: p.reportingPeriod.year,
    periodType: p.reportingPeriod.periodType ?? null,
  } : null,
  user: p.user ? {
    id: p.user.id,
    name: p.user.name,
  } : null,
});

export const listProjects: AppRouteHandler<ListProjectsRoute> = async (c) => {
  // try {
    const query = c.req.valid("query");

    const whereConditions = [] as any[];
    if (query.facilityId) {
      whereConditions.push(eq(schema.projects.facilityId, query.facilityId));
    }
    if (query.status) {
      whereConditions.push(eq(schema.projects.status, query.status));
    }

    const rows = await db.query.projects.findMany({
      where: whereConditions.length > 0 ? and(...whereConditions) : undefined,
      orderBy: desc(schema.projects.updatedAt),
    });

    return c.json({ data: rows.map(mapProject) }, HttpStatusCodes.OK);
  // } catch (error) {
  //   c.get("logger").error("Error listing projects:", error);
  //   return c.json(
  //     {
  //       error: "INTERNAL_ERROR",
  //       message: "Failed to retrieve projects",
  //     },
  //     500
  //   );
  // }
};

export const listUserProjects: AppRouteHandler<ListUserProjectsRoute> = async (
  c
) => {
  // try {
  const { userId } = c.req.valid("param");

  const rows = await db.query.projects.findMany({
    where: eq(schema.projects.userId, userId),
    orderBy: desc(schema.projects.createdAt),
  });

  return c.json({ data: rows.map(mapProject) }, HttpStatusCodes.OK);
  // } catch (error) {
  //   c.get("logger").error("Error listing user projects:", error);
  //   return c.json(
  //     {
  //       error: "INTERNAL_ERROR",
  //       message: "Failed to retrieve user projects",
  //     },
  //     500
  //   );
  // }
};

export const getProject: AppRouteHandler<GetProjectRoute> = async (c) => {
  try {
    const { id } = c.req.valid("param");
    const row = await db.query.projects.findFirst({
      where: eq(schema.projects.id, id),
    });
    if (!row) {
      return c.json({ error: "NOT_FOUND", message: "Project not found" }, HttpStatusCodes.NOT_FOUND);
    }
    return c.json(mapProject(row), HttpStatusCodes.OK);
  } catch (error) {
    c.get("logger").error("Error fetching project:", error);
    return c.json({ error: "INTERNAL_ERROR", message: "Failed to retrieve project" }, 500);
  }
};

export const createProject: AppRouteHandler<CreateProjectRoute> = async (c) => {
  try {
    const body = c.req.valid("json");

    const base = (body.name ?? "PRJ").replace(/[^A-Za-z0-9]/g, "").slice(0, 10);
    const code = base + Math.random().toString(36).slice(-3).toUpperCase();

    const insertData = {
      name: body.name,
      status: body.status ?? "ACTIVE",
      code,
    } as const;

    const inserted = await db.insert(schema.projects)
                            .values(insertData)
                            .onConflictDoNothing()  // idempotent by unique indexes
                            .returning();

    let projectRow;

    if (inserted.length > 0) {
      projectRow = inserted[0];
    } else {
      // Already exists – fetch existing by name
      projectRow = await db.query.projects.findFirst({
        where: eq(schema.projects.name, insertData.name),
      });
    }

    if (!projectRow) {
      throw new Error("Unable to create or retrieve project");
    }

    const fullRow = await db.query.projects.findFirst({
      where: eq(schema.projects.id, projectRow.id),
      with: {
        facility: true,
        reportingPeriod: true,
        user: true,
      },
    });

    return c.json(mapProject(fullRow), 201);
  } catch (error) {
    c.get("logger").error("Error creating project:", error);
    return c.json({ error: "INTERNAL_ERROR", message: "Failed to create project" }, 500);
  }
};

export const updateProjectStatus: AppRouteHandler<UpdateProjectStatusRoute> = async (
  c
) => {
  try {
    const { id } = c.req.valid("param");
    const { status, userId } = c.req.valid("json");

    const [updatedProject] = await db
      .update(schema.projects)
      .set({ status })
      .where(
        and(eq(schema.projects.id, id), eq(schema.projects.userId, userId))
      )
      .returning({
        id: schema.projects.id,
        status: schema.projects.status,
      });

    if (!updatedProject) {
      return c.json(
        { error: "NOT_FOUND", message: "Project not found or user unauthorized" },
        HttpStatusCodes.NOT_FOUND
      );
    }

    return c.json({ id: updatedProject.id, status: updatedProject.status }, HttpStatusCodes.OK);
  } catch (error) {
    c.get("logger").error("Error updating project status:", error);
    return c.json(
      {
        error: "INTERNAL_ERROR",
        message: "Failed to update project status",
      },
      500
    );
  }
};

export const checkProjectExists: AppRouteHandler<CheckProjectExistsRoute> = async (
  c
) => {
  // try {
  const { facilityId, reportingPeriodId, userId } = c.req.valid("query");

  const project = await db.query.projects.findFirst({
    where: and(
      eq(schema.projects.facilityId, facilityId),
      eq(schema.projects.reportingPeriodId, reportingPeriodId),
      eq(schema.projects.userId, userId)
    ),
    columns: {
      id: true,
      name: true,
      status: true,
    },
  });

  if (project) {
    return c.json({ exists: true, project }, HttpStatusCodes.OK);
  }

  return c.json({ exists: false, project: null }, HttpStatusCodes.OK);
  // } catch (error) {
  //   c.get("logger").error("Error checking project existence:", error);
  //   return c.json(
  //     {
  //       error: "INTERNAL_ERROR",
  //       message: "Failed to check project existence",
  //     },
  //     500
  //   );
  // }
};
