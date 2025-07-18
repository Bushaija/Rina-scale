import { AppRouteHandler } from "../../lib/types";
import { ListPlanningActivitiesRoute, GetPlanningActivitiesByFacilityIdRoute, GetPlanningTotalsByFacilityIdRoute } from "./planning-activities.routes";
import { db } from "@/db";
import * as schemas from "@/db/schema";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { asc, eq, sum, count, and } from "drizzle-orm";

export const listPlanningActivities: AppRouteHandler<ListPlanningActivitiesRoute> = async (c) => {
    // const data = await db.query.planningActivities.findMany();
    const data = await db
        .select({
            id: schemas.planningActivities.id,
            name: schemas.planningActivities.name,
            displayOrder: schemas.planningActivities.displayOrder,
            isTotalRow: schemas.planningActivities.isTotalRow,
            categoryId: schemas.planningActivities.categoryId,
            projectId: schemas.planningActivities.projectId,
            categoryCode: schemas.planningCategories.code,
            categoryName: schemas.planningCategories.name,
            projectName: schemas.projects.name,
        })
        .from(schemas.planningActivities)
        .leftJoin(schemas.planningCategories, eq(schemas.planningActivities.categoryId, schemas.planningCategories.id))
        .leftJoin(schemas.projects, eq(schemas.planningActivities.projectId, schemas.projects.id))
        .orderBy(
            asc(schemas.planningActivities.displayOrder),
            asc(schemas.planningCategories.displayOrder),
        );
    return c.json({ data }, HttpStatusCodes.OK);
};

export const getPlanningActivitiesByFacilityId: AppRouteHandler<GetPlanningActivitiesByFacilityIdRoute> = async (c) => {
    const { facilityId } = c.req.valid("param");
    const { program, reportingPeriod, projectCode } = c.req.valid("query");
    const user = c.get("user");
    
    console.log("API Request Parameters:", { facilityId, program, reportingPeriod, projectCode });

    console.log("user", user);

    // Authorization check: ensure user can only access data for facilities in their district
    if (!user?.facilityId) {
        return c.json({ error: "User facility not found" }, HttpStatusCodes.UNAUTHORIZED);
    }

    // Get user's facility and district
    const userFacility = await db.query.facilities.findFirst({
        where: eq(schemas.facilities.id, user.facilityId),
        columns: { districtId: true }
    });

    if (!userFacility) {
        return c.json({ error: "User facility not found" }, HttpStatusCodes.UNAUTHORIZED);
    }

    // Get requested facility's district
    const requestedFacility = await db.query.facilities.findFirst({
        where: eq(schemas.facilities.id, facilityId),
        columns: { districtId: true }
    });

    if (!requestedFacility) {
        return c.json({ message: "Requested facility not found" }, HttpStatusCodes.NOT_FOUND);
    }

    // Check if both facilities are in the same district
    if (userFacility.districtId !== requestedFacility.districtId) {
        return c.json({ 
            error: "Access denied", 
            message: "You can only access data for facilities in your district" 
        }, HttpStatusCodes.FORBIDDEN);
    }

    try {
        // Build dynamic where conditions
        const whereConditions = [eq(schemas.planningData.facilityId, facilityId)];
        
        // Map program names to project codes for filtering
        const programToProjectCode: Record<string, string> = {
            'hiv': 'HIV',
            'malaria': 'MAL',
            'tb': 'TB',
            'HIV': 'HIV',
            'MAL': 'MAL', 
            'TB': 'TB'
        };
        
        // Filter by program/project code if provided
        if (program) {
            const mappedProjectCode = programToProjectCode[program] || program.toUpperCase();
            whereConditions.push(eq(schemas.projects.code, mappedProjectCode));
            console.log(`Filtering by program: ${program} -> project code: ${mappedProjectCode}`);
        } else if (projectCode) {
            whereConditions.push(eq(schemas.projects.code, projectCode));
            console.log(`Filtering by project code: ${projectCode}`);
        }
        
        // Filter by reporting period if provided
        if (reportingPeriod) {
            whereConditions.push(eq(schemas.planningData.reportingPeriodId, reportingPeriod));
            console.log(`Filtering by reporting period: ${reportingPeriod}`);
        }

        // Query planning data with activities for a specific facility
        const data = await db
            .select({
                // Planning Data fields
                planningDataId: schemas.planningData.id,
                facilityId: schemas.planningData.facilityId,
                frequency: schemas.planningData.frequency,
                unitCost: schemas.planningData.unitCost,
                countQ1: schemas.planningData.countQ1,
                countQ2: schemas.planningData.countQ2,
                countQ3: schemas.planningData.countQ3,
                countQ4: schemas.planningData.countQ4,
                amountQ1: schemas.planningData.amountQ1,
                amountQ2: schemas.planningData.amountQ2,
                amountQ3: schemas.planningData.amountQ3,
                amountQ4: schemas.planningData.amountQ4,
                totalBudget: schemas.planningData.totalBudget,
                comment: schemas.planningData.comment,
                // Planning Activity fields
                activityId: schemas.planningActivities.id,
                activityName: schemas.planningActivities.name,
                displayOrder: schemas.planningActivities.displayOrder,
                isTotalRow: schemas.planningActivities.isTotalRow,
                facilityType: schemas.planningActivities.facilityType,
                // Category fields
                categoryId: schemas.planningCategories.id,
                categoryCode: schemas.planningCategories.code,
                categoryName: schemas.planningCategories.name,
                categoryDisplayOrder: schemas.planningCategories.displayOrder,
                // Project fields
                projectId: schemas.projects.id,
                projectName: schemas.projects.name,
            })
            .from(schemas.planningData)
            .innerJoin(schemas.planningActivities, eq(schemas.planningData.activityId, schemas.planningActivities.id))
            .leftJoin(schemas.planningCategories, eq(schemas.planningActivities.categoryId, schemas.planningCategories.id))
            .leftJoin(schemas.projects, eq(schemas.planningData.projectId, schemas.projects.id))
            .where(and(...whereConditions))
            .orderBy(
                asc(schemas.planningCategories.displayOrder),
                asc(schemas.planningActivities.displayOrder),
            );

        if (data.length === 0) {
            return c.json({ message: "No planning data found for this facility" }, HttpStatusCodes.NOT_FOUND);
        }

        return c.json({ data }, HttpStatusCodes.OK);
    } catch (error) {
        console.error("Error fetching planning activities by facility ID:", error);
        return c.json({ message: "Internal server error" }, HttpStatusCodes.INTERNAL_SERVER_ERROR);
    }
};

export const getPlanningTotalsByFacilityId: AppRouteHandler<GetPlanningTotalsByFacilityIdRoute> = async (c) => {
    const { facilityId } = c.req.valid("param");
    const user = c.get("user");

    // Authorization check: ensure user can only access data for facilities in their district
    if (!user?.facilityId) {
        return c.json({ error: "User facility not found" }, HttpStatusCodes.UNAUTHORIZED);
    }

    // Get user's facility and district
    const userFacility = await db.query.facilities.findFirst({
        where: eq(schemas.facilities.id, user.facilityId),
        columns: { districtId: true }
    });

    if (!userFacility) {
        return c.json({ error: "User facility not found" }, HttpStatusCodes.UNAUTHORIZED);
    }

    // Get requested facility's district
    const requestedFacility = await db.query.facilities.findFirst({
        where: eq(schemas.facilities.id, facilityId),
        columns: { districtId: true }
    });

    if (!requestedFacility) {
        return c.json({ message: "Requested facility not found" }, HttpStatusCodes.NOT_FOUND);
    }

    // Check if both facilities are in the same district
    if (userFacility.districtId !== requestedFacility.districtId) {
        return c.json({ 
            error: "Access denied", 
            message: "You can only access data for facilities in your district" 
        }, HttpStatusCodes.FORBIDDEN);
    }

    try {
        // Query to get planning totals for a specific facility
        const result = await db
            .select({
                facilityId: schemas.planningData.facilityId,
                q1Total: sum(schemas.planningData.amountQ1),
                q2Total: sum(schemas.planningData.amountQ2),
                q3Total: sum(schemas.planningData.amountQ3),
                q4Total: sum(schemas.planningData.amountQ4),
                grandTotal: sum(schemas.planningData.totalBudget),
                recordCount: count(schemas.planningData.id),
            })
            .from(schemas.planningData)
            .where(eq(schemas.planningData.facilityId, facilityId))
            .groupBy(schemas.planningData.facilityId);

        if (result.length === 0) {
            return c.json({ message: "No planning data found for this facility" }, HttpStatusCodes.NOT_FOUND);
        }

        const totals = result[0];
        
        // Convert string totals to numbers (since DB returns them as strings)
        const response = {
            facilityId: totals.facilityId,
            q1Total: parseFloat(totals.q1Total || '0'),
            q2Total: parseFloat(totals.q2Total || '0'),
            q3Total: parseFloat(totals.q3Total || '0'),
            q4Total: parseFloat(totals.q4Total || '0'),
            grandTotal: parseFloat(totals.grandTotal || '0'),
            recordCount: Number(totals.recordCount || 0)
        };

        return c.json(response, HttpStatusCodes.OK);
    } catch (error) {
        console.error("Error fetching planning totals by facility ID:", error);
        return c.json({ message: "Internal server error" }, HttpStatusCodes.INTERNAL_SERVER_ERROR);
    }
};