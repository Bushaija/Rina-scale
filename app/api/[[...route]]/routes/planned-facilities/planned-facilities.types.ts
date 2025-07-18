import { z } from "zod";

export const GetPlannedFacilitiesSchema = z.object({
    id: z.number(),
    facilityName: z.string(),
    facilityType: z.enum(["hospital", "health_center"]),
    districtName: z.string(),
    dateModified: z.string().nullable(),
    projectCode: z.string(),
});