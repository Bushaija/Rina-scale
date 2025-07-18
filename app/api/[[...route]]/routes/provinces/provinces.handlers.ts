import { eq } from "drizzle-orm";
import * as HttpStatusCodes from "stoker/http-status-codes";
// import * as HttpStatusPhrases from "stoker/http-status-phrases";        

import type { AppRouteHandler } from "../../lib/types";

import { db } from "@/db";
import { provinces } from "@/db/schema";

// import type { ListRoute, CreateRoute, GetOneRoute, UpdateRoute, RemoveRoute } from "./provinces.routes";
import type { ListRoute, GetOneRoute } from "./provinces.routes";

export const list: AppRouteHandler<ListRoute> = async (c) => {
    const data = await db.query.provinces.findMany();
    return c.json(data);
};

// export const create: AppRouteHandler<CreateRoute> = async (c) => {
//     const province = c.req.valid("json");
//     try {
//         const [newProvince] = await db.insert(provinces).values(province).returning();
//         return c.json(newProvince, HttpStatusCodes.CREATED);
//     } catch (e: any) {
//         if (e.code === "23505") {
//             return c.json(
//                 {
//                     error: HttpStatusPhrases.BAD_REQUEST,
//                     message: "A province with this name already exists",
//                 },
//                 HttpStatusCodes.BAD_REQUEST
//             );
//         }
//         throw e;
//     }
// };

export const getOne: AppRouteHandler<GetOneRoute> = async (c) => {
    const { id } = c.req.valid("param");
    const data = await db.query.provinces.findFirst({
        where: eq(provinces.id, id),
    });

    if (!data) {
        return c.json(
            {
                message: "Province not found",
            },
            HttpStatusCodes.NOT_FOUND
        );
    }
    return c.json(data, HttpStatusCodes.OK);
};

// export const update: AppRouteHandler<UpdateRoute> = async (c) => {
//     const { id } = c.req.valid("param");
//     const province = c.req.valid("json");

//     const [updatedProvince] = await db
//         .update(provinces)
//         .set(province)
//         .where(eq(provinces.id, id))
//         .returning();

//     if (!updatedProvince) {
//         return c.json(
//             {
//                 message: "Province not found",
//             },
//             HttpStatusCodes.NOT_FOUND
//         );
//     }

//     return c.json(updatedProvince, HttpStatusCodes.OK);
// };

// export const remove: AppRouteHandler<RemoveRoute> = async (c) => {
//     const { id } = c.req.valid("param");
//     const [deleted] = await db
//         .delete(provinces)
//         .where(eq(provinces.id, id))
//         .returning({ id: provinces.id });
    
//     if (!deleted) {
//         return c.json(
//             {
//                 message: "Province not found",
//             },
//             HttpStatusCodes.NOT_FOUND
//         );
//     }

//     return c.body(null, HttpStatusCodes.NO_CONTENT);
// };