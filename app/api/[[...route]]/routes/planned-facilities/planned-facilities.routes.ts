import { createRoute, z } from "@hono/zod-openapi";
import { jsonContent } from "stoker/openapi/helpers";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { GetPlannedFacilitiesSchema } from "./planned-facilities.types"

const tags = ["planned-facilities"];

export const PlannedFacilitySchema = z.object({
  id: z.number(),
  facilityName: z.string(),
  facilityType: z.enum(["hospital", "health_center"]),
  districtName: z.string().nullable(),
  dateModified: z.date().nullable(),
  projectCode: z.string(),
});

// GET /planning
export const getAllPlanningData = createRoute({
  method: "get",
  path: "/planning",
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.array(
        GetPlannedFacilitiesSchema
      ),
      "List of planned facilities"
    ),
  },
  tags,
});

// GET /planning/planned-facilities
export const getAlreadyPlannedFacilities = createRoute({
  method: "get",
  path: "/planning/planned-facilities",
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.array(PlannedFacilitySchema),
      "List of facilities that have been already planned."
    ),
  },
  tags,
});

export type GetAllPlanningDataRoute = typeof getAllPlanningData;
export type GetAlreadyPlannedFacilitiesRoute = typeof getAlreadyPlannedFacilities;