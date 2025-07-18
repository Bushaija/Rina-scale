import { eq, asc } from "drizzle-orm";
import * as HttpStatusCodes from "stoker/http-status-codes";
// import * as HttpStatusPhrases from "stoker/http-status-phrases";

import type { AppRouteHandler } from "../../lib/types"; 

import { db } from "@/db";
import { facilities } from "@/db/schema";

// import type { ListRoute, CreateRoute, GetOneRoute, UpdateRoute, RemoveRoute } from "./facilities.routes";
import type { ListRoute, GetOneRoute, GetByNameRoute, GetByDistrictRoute } from "./facilities.routes";

export const getByDistrict: AppRouteHandler<GetByDistrictRoute> = async (c) => {
    const { districtId } = c.req.valid("query");

    const data = await db.select({
        id: facilities.id,
        name: facilities.name,
        facilityType: facilities.facilityType,
    })
        .from(facilities)
        .where(eq(facilities.districtId, districtId))
        .orderBy(asc(facilities.name));

    if (data.length === 0) {
        return c.json(
            {
                message: "Facilities not found for this district",
            },
            HttpStatusCodes.NOT_FOUND
        );
    }

    return c.json(data, HttpStatusCodes.OK);
};

export const list: AppRouteHandler<ListRoute> = async (c) => {
    const data = await db.query.facilities.findMany();
    return c.json(data);
};

// export const create: AppRouteHandler<CreateRoute> = async (c) => {
//     const facility = c.req.valid("json");
//     try {
//         const [newFacility] = await db.insert(facilities).values(facility).returning();
//         return c.json(newFacility, HttpStatusCodes.CREATED);
//     } catch (e: any) {
//         if (e.code === "23505") {
//             return c.json(
//                 {
//                     error: HttpStatusPhrases.BAD_REQUEST,
//                     message: "A facility with this name already exists",
//                 },
//                 HttpStatusCodes.BAD_REQUEST
//             );
//         }
//         throw e;
//     }
// };

export const getOne: AppRouteHandler<GetOneRoute> = async (c) => {
    const { id } = c.req.valid("param");
    const data = await db.query.facilities.findFirst({
        where: eq(facilities.id, id),
    });

    if (!data) {
        return c.json(
            {
                message: "Facility not found",
            },
            HttpStatusCodes.NOT_FOUND
        );
    }
    return c.json(data, HttpStatusCodes.OK);
};

// export const update: AppRouteHandler<UpdateRoute> = async (c) => {
//     const { id } = c.req.valid("param");
//     const facility = c.req.valid("json");

//     const [updatedFacility] = await db
//         .update(facilities)
//         .set(facility)
//         .where(eq(facilities.id, id))
//         .returning();

//     if (!updatedFacility) {
//         return c.json(
//             {
//                 message: "Facility not found",
//             },
//             HttpStatusCodes.NOT_FOUND
//         );
//     }

//     return c.json(updatedFacility, HttpStatusCodes.OK);
// };

// export const remove: AppRouteHandler<RemoveRoute> = async (c) => {
//     const { id } = c.req.valid("param");
//     const [deleted] = await db
//         .delete(facilities)
//         .where(eq(facilities.id, id))
//         .returning({ id: facilities.id });
    
//     if (!deleted) {
//         return c.json(
//             {
//                 message: "Facility not found",
//             },
//             HttpStatusCodes.NOT_FOUND
//         );
//     }

//     return c.body(null, HttpStatusCodes.NO_CONTENT);
// };

export const getByName: AppRouteHandler<GetByNameRoute> = async (c) => {
    const query = c.req.valid("query");


    // Validate that facilityName is provided and not empty
    if (!query.facilityName || query.facilityName.trim() === '') {
        return c.json(
            {
                message: "Facility name is required",
            },
            HttpStatusCodes.BAD_REQUEST
        );
    }

    const data = await db.query.facilities.findFirst({
        where: eq(facilities.name, query.facilityName.trim()),
    });

    if (!data) {
        return c.json(
            {
                message: "Facility not found",
            },
            HttpStatusCodes.NOT_FOUND
        );
    }

    // Ensure numeric fields are properly typed
    // const response = {
    //     ...data,
    //     id: Number(data.id),
    //     districtId: Number(data.districtId)
    // };

    return c.json({facilityId: data.id, facilityName: data.name}, HttpStatusCodes.OK);
};
