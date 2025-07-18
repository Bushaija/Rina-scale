import { createRoute, z } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContent, jsonContentRequired } from "stoker/openapi/helpers";
import { IdParamsSchema } from "stoker/openapi/schemas";

// import { insertDistrictSchema, patchDistrictSchema, selectDistrictSchema } from "@/db/schema";
import { selectDistrictSchema } from "./districts.types";
import { notFoundSchema } from "../../lib/constants";

const tags = ["districts"];

export const list = createRoute({
    path: "/districts",
    method: "get",
    tags,
    responses: {
        [HttpStatusCodes.OK]: jsonContent(
            z.array(selectDistrictSchema),
            "The list of districts"
        )
    }
});

// export const create = createRoute({
//     path: "/districts",
//     method: "post",
//     tags,
//     request: {
//         body: jsonContentRequired(insertDistrictSchema, "The district to create"),
//     },
//     responses: {
//         [HttpStatusCodes.CREATED]: jsonContent(
//             selectDistrictSchema,
//             "The created district"
//         ),
//         [HttpStatusCodes.BAD_REQUEST]: jsonContent(
//             z.object({
//                 error: z.string(),
//                 message: z.string(),
//             }),
//             "Invalid district data"
//         ),
//     }
// });

export const getOne = createRoute({
    path: "/districts/{id}",
    method: "get",
    tags,
    request: {
        params: IdParamsSchema,
    },
    responses: {
        [HttpStatusCodes.OK]: jsonContent(
            selectDistrictSchema,
            "The district"
        ),
        [HttpStatusCodes.NOT_FOUND]: jsonContent(
            notFoundSchema,
            "District not found"
        ),
    }
});

// export const update = createRoute({
//     path: "/districts/{id}",
//     method: "patch",
//     tags,
//     request: {
//         params: IdParamsSchema,
//         body: jsonContentRequired(patchDistrictSchema, "The district data to update"),
//     },
//     responses: {
//         [HttpStatusCodes.OK]: jsonContent(
//             selectDistrictSchema,
//             "The updated district"
//         ),
//         [HttpStatusCodes.NOT_FOUND]: jsonContent(
//             notFoundSchema,
//             "District not found"
//         ),
//     }
// });

// export const remove = createRoute({
//     path: "/districts/{id}",
//     method: "delete",
//     tags,
//     request: {
//         params: IdParamsSchema,
//     },
//     responses: {
//         [HttpStatusCodes.NO_CONTENT]: {
//             description: "The district was deleted",
//         },
//         [HttpStatusCodes.NOT_FOUND]: jsonContent(
//             notFoundSchema,
//             "District not found"
//         ),
//     }
// });

export type ListRoute = typeof list;
export type GetOneRoute = typeof getOne;
// export type CreateRoute = typeof create;
// export type UpdateRoute = typeof update;
// export type RemoveRoute = typeof remove;
