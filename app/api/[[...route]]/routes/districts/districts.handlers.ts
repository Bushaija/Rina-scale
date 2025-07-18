import { eq } from "drizzle-orm";
import * as HttpStatusCodes from "stoker/http-status-codes";
// import * as HttpStatusPhrases from "stoker/http-status-phrases";

import type { AppRouteHandler } from "../../lib/types";

import { db } from "@/db";
import { districts } from "@/db/schema";

// import type { ListRoute, CreateRoute, GetOneRoute, UpdateRoute, RemoveRoute } from "./districts.routes";
import type { ListRoute, GetOneRoute } from "./districts.routes";

export const list: AppRouteHandler<ListRoute> = async (c) => {
    const data = await db.query.districts.findMany();
    return c.json(data);
};

// export const create: AppRouteHandler<CreateRoute> = async (c) => {
//     const district = c.req.valid("json");
//     try {
//         const [newDistrict] = await db.insert(districts).values(district).returning();
//         return c.json(newDistrict, HttpStatusCodes.CREATED);
//     } catch (e: any) {
//         if (e.code === "23505") {
//             return c.json(
//                 {
//                     error: HttpStatusPhrases.BAD_REQUEST,
//                     message: "A district with this name already exists",
//                 },
//                 HttpStatusCodes.BAD_REQUEST
//             );
//         }
//         throw e;
//     }
// };

export const getOne: AppRouteHandler<GetOneRoute> = async (c) => {
    const { id } = c.req.valid("param");
    const data = await db.query.districts.findFirst({
        where: eq(districts.id, id),
    });

    if (!data) {
        return c.json(
            {
                message: "District not found",
            },
            HttpStatusCodes.NOT_FOUND
        );
    }
    return c.json(data, HttpStatusCodes.OK);
};

// export const update: AppRouteHandler<UpdateRoute> = async (c) => {
//     const { id } = c.req.valid("param");
//     const district = c.req.valid("json");

//     const [updatedDistrict] = await db
//         .update(districts)
//         .set(district)
//         .where(eq(districts.id, id))
//         .returning();

//     if (!updatedDistrict) {
//         return c.json(
//             {
//                 message: "District not found",
//             },
//             HttpStatusCodes.NOT_FOUND
//         );
//     }

//     return c.json(updatedDistrict, HttpStatusCodes.OK);
// };

// export const remove: AppRouteHandler<RemoveRoute> = async (c) => {
//     const { id } = c.req.valid("param");
//     const [deleted] = await db
//         .delete(districts)
//         .where(eq(districts.id, id))
//         .returning({ id: districts.id });
    
//     if (!deleted) {
//         return c.json(
//             {
//                 message: "District not found",
//             },
//             HttpStatusCodes.NOT_FOUND
//         );
//     }

//     return c.body(null, HttpStatusCodes.NO_CONTENT);
// };
