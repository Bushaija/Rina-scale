import { createRoute, z } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
// import { jsonContent, jsonContentRequired } from "stoker/openapi/helpers";
import { jsonContent } from "stoker/openapi/helpers";
import { IdParamsSchema } from "stoker/openapi/schemas";

// import { insertFacilitySchema, patchFacilitySchema, selectFacilitySchema } from "@/db/schema";
import { selectFacilitySchema } from "./facilities.types";
import { badRequestSchema, notFoundSchema } from "../../lib/constants";

const tags = ["facilities"];

export const FacilityByDistrictSchema = selectFacilitySchema.pick({
    id: true,
    name: true,
    facilityType: true,
});


export const getByDistrict = createRoute({
    path: "/facilities/by-district",
    method: "get",
    tags,
    request: {
        query: z.object({
            districtId: z.coerce.number().int().positive("District ID must be a positive integer"),
        }),
    },
    responses: {
        [HttpStatusCodes.OK]: jsonContent(
            z.array(FacilityByDistrictSchema),
            "A list of facilities in the district"
        ),
        [HttpStatusCodes.BAD_REQUEST]: jsonContent(
            badRequestSchema,
            "Invalid district ID"
        ),
        [HttpStatusCodes.NOT_FOUND]: jsonContent(
            notFoundSchema,
            "Facilities not found"
        ),
    },
});

export const getByName = createRoute({
    path: "/facilities/by-name",
    method: "get",
    tags,
    request: {
        query: z.object({
            facilityName: z.string().min(1, "Facility name is required"),
            // districtName: z.string().trim(),
            // provinceName: z.string().trim(),
        }),
    },
    responses: {
        [HttpStatusCodes.OK]: jsonContent(
            z.object({
                facilityId: z.coerce.number(),
                facilityName: z.string(),
            }),
            "The facility"
        ),
        [HttpStatusCodes.NOT_FOUND]: jsonContent(
            notFoundSchema,
            "Facility not found"
        ),
        [HttpStatusCodes.BAD_REQUEST]: jsonContent(
            badRequestSchema,
            "Invalid facility data"
        ),
    },
});

export const list = createRoute({
    path: "/facilities",
    method: "get",
    tags,
    responses: {
        [HttpStatusCodes.OK]: jsonContent(
            z.array(selectFacilitySchema),
            "The list of facilities"
        )
    }
});

// export const create = createRoute({
//     path: "/facilities",
//     method: "post",
//     tags,
//     request: {
//         body: jsonContentRequired(insertFacilitySchema, "The facility to create"),
//     },
//     responses: {
//         [HttpStatusCodes.CREATED]: jsonContent(
//             selectFacilitySchema,
//             "The created facility"
//         ),
//         [HttpStatusCodes.BAD_REQUEST]: jsonContent(
//             z.object({
//                 error: z.string(),
//                 message: z.string(),
//             }),
//             "Invalid facility data"
//         ),
//     }
// });

export const getOne = createRoute({
    path: "/facilities/{id}",
    method: "get",
    tags,
    request: {
        params: IdParamsSchema,
    },
    responses: {
        [HttpStatusCodes.OK]: jsonContent(
            selectFacilitySchema,
            "The facility"
        ),
        [HttpStatusCodes.NOT_FOUND]: jsonContent(
            notFoundSchema,
            "Facility not found"
        ),
    }
});

// export const update = createRoute({
//     path: "/facilities/{id}",
//     method: "patch",
//     tags,
//     request: {
//         params: IdParamsSchema,
//         body: jsonContentRequired(patchFacilitySchema, "The facility data to update"),
//     },
//     responses: {
//         [HttpStatusCodes.OK]: jsonContent(
//             selectFacilitySchema,
//             "The updated facility"
//         ),
//         [HttpStatusCodes.NOT_FOUND]: jsonContent(
//             notFoundSchema,
//             "Facility not found"
//         ),
//     }
// });

// export const remove = createRoute({
//     path: "/facilities/{id}",
//     method: "delete",
//     tags,
//     request: {
//         params: IdParamsSchema,
//     },
//     responses: {
//         [HttpStatusCodes.NO_CONTENT]: {
//             description: "The facility was deleted",
//         },
//         [HttpStatusCodes.NOT_FOUND]: jsonContent(
//             notFoundSchema,
//             "Facility not found"
//         ),
//     }
// });

export type GetByDistrictRoute = typeof getByDistrict;
export type GetByNameRoute = typeof getByName;
export type ListRoute = typeof list;
export type GetOneRoute = typeof getOne;
// export type CreateRoute = typeof create;
    // export type UpdateRoute = typeof update;
    // export type RemoveRoute = typeof remove;
