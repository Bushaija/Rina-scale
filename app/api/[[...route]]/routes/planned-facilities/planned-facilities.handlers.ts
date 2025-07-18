import db from "@/db";
import * as schema from "@/db/schema";
import { eq, desc, max, isNotNull, and } from "drizzle-orm";
import * as HttpStatusCodes from "stoker/http-status-codes";
import type { AppRouteHandler } from "../../lib/types";
import { GetAllPlanningDataRoute, GetAlreadyPlannedFacilitiesRoute } from "./planned-facilities.routes";

export const getAllPlanningData: AppRouteHandler<GetAllPlanningDataRoute> = async (c) => {
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
            dateModified: max(schema.planningData.updatedAt),
            projectCode: schema.projects.code,
        })
        .from(schema.facilities)
        .innerJoin(
            schema.districts,
            eq(schema.facilities.districtId, schema.districts.id)
        )
        .innerJoin(
            schema.planningData,
            eq(schema.facilities.id, schema.planningData.facilityId)
        )
        .innerJoin(
            schema.projects,
            eq(schema.planningData.projectId, schema.projects.id)
        )
        .where(
            and(
                isNotNull(schema.planningData.updatedAt),
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
        .orderBy(desc(max(schema.planningData.updatedAt)));

    // Return the array directly so it matches the OpenAPI schema (array of objects)
    return c.json(data, HttpStatusCodes.OK);
};

export const getAlreadyPlannedFacilities: AppRouteHandler<GetAlreadyPlannedFacilitiesRoute> = async (c) => {
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
            facilityName: schema.facilities.name,
            facilityType: schema.facilities.facilityType,
            districtName: schema.districts.name,
            dateModified: max(schema.planningData.updatedAt),
            projectCode: schema.projects.code,
        })
        .from(schema.facilities)
        .innerJoin(
            schema.districts,
            eq(schema.facilities.districtId, schema.districts.id)
        )
        .leftJoin(
            schema.executionData,
            eq(schema.facilities.id, schema.executionData.facilityId)
        )
        .leftJoin(
            schema.planningData,
            eq(schema.facilities.id, schema.planningData.facilityId)
        )
        .innerJoin(
            schema.projects,
            eq(schema.planningData.projectId, schema.projects.id)
        )
        .where(
            and(
                isNotNull(schema.executionData.id),
                isNotNull(schema.planningData.updatedAt),
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
        .orderBy(desc(max(schema.planningData.updatedAt)));

    const data = rawData.map((d) => ({
        ...d,
        dateModified: d.dateModified ? new Date(d.dateModified) : null,
    }));

    return c.json(data, HttpStatusCodes.OK);
};